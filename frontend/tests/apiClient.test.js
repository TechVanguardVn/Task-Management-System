import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'
import { AxiosError } from 'axios'
import { createApiClient } from '../src/api/createApiClient.js'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '../src/api/tokenStore.js'

afterEach(clearAccessToken)

test('matching concurrent unauthorized requests emit one expiry notification, public/stale 401s emit none', async () => {
  let events = 0
  const client = createApiClient('https://api.example.com', {
    onSessionExpired: () => events++,
  })
  setAccessToken('test-only-token')
  await Promise.allSettled([
    client.get('/first', { adapter: failure(401) }),
    client.get('/second', { adapter: failure(401) }),
  ])
  assert.equal(events, 1)
  await assert.rejects(client.get('/public', { adapter: failure(401) }))
  assert.equal(events, 1)
  setAccessToken('old-test-token')
  await assert.rejects(
    client.get('/stale', {
      adapter: failure(401, () => setAccessToken('new-test-token')),
    }),
  )
  assert.equal(events, 1)
})

const origin = 'https://api.example.com'
const success = (config) =>
  Promise.resolve({
    config,
    data: {},
    status: 200,
    statusText: 'OK',
    headers: {},
  })

function failure(status, beforeFailure = () => {}) {
  return (config) => {
    beforeFailure()
    throw new AxiosError('Test response', undefined, config, undefined, {
      status,
      data: {},
      headers: {},
      config,
    })
  }
}

test('sets bearer headers and retains safe API defaults', async () => {
  setAccessToken('test-only-token')
  const response = await createApiClient(origin).get('/relative', {
    adapter: success,
  })
  assert.equal(
    response.config.headers.get('Authorization'),
    'Bearer test-only-token',
  )
  assert.equal(response.config.headers.get('Accept'), 'application/json')
  assert.equal(response.config.timeout, 15000)
  assert.equal(response.config.withCredentials, false)
})

test('does not send a stale caller authorization header without a token', async () => {
  const response = await createApiClient(origin).get('/relative', {
    headers: { Authorization: 'Bearer stale-test-token' },
    adapter: success,
  })
  assert.equal(response.config.headers.has('Authorization'), false)
})

test('clears the current token after a 401', async () => {
  setAccessToken('test-only-token')
  await assert.rejects(
    createApiClient(origin).get('/relative', { adapter: failure(401) }),
  )
  assert.equal(getAccessToken(), null)
})

test('does not clear a newer session after a late 401 for an old token', async () => {
  setAccessToken('old-test-token')
  await assert.rejects(
    createApiClient(origin).get('/relative', {
      adapter: failure(401, () => setAccessToken('new-test-token')),
    }),
  )
  assert.equal(getAccessToken(), 'new-test-token')
})

test('preserves the token on a forbidden response', async () => {
  setAccessToken('test-only-token')
  await assert.rejects(
    createApiClient(origin).get('/relative', { adapter: failure(403) }),
  )
  assert.equal(getAccessToken(), 'test-only-token')
})

test('preserves the token on a network failure', async () => {
  setAccessToken('test-only-token')
  await assert.rejects(
    createApiClient(origin).get('/relative', {
      adapter: (config) => {
        throw new AxiosError('Test network failure', 'ERR_NETWORK', config)
      },
    }),
  )
  assert.equal(getAccessToken(), 'test-only-token')
})

test('rejects absolute URLs and overridden API origins before sending a token', async () => {
  setAccessToken('test-only-token')
  let sent = false
  const client = createApiClient(origin)
  const adapter = (config) => {
    sent = true
    return success(config)
  }
  for (const url of ['https://other.example.com', '//other.example.com']) {
    await assert.rejects(client.get(url, { adapter }))
  }
  await assert.rejects(
    client.get('/relative', { baseURL: 'https://other.example.com', adapter }),
  )
  assert.equal(sent, false)
})
