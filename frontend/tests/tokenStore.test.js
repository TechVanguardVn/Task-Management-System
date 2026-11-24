import assert from 'node:assert/strict'
import test from 'node:test'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
  subscribeToToken,
} from '../src/api/tokenStore.js'

test('stores tokens in memory, notifies subscribers, and clears them', () => {
  clearAccessToken()
  let changes = 0
  const unsubscribe = subscribeToToken(() => {
    changes += 1
  })
  assert.equal(getAccessToken(), null)
  setAccessToken('test-only-token')
  setAccessToken('test-only-token')
  assert.equal(getAccessToken(), 'test-only-token')
  clearAccessToken()
  assert.equal(changes, 2)
  assert.equal(getAccessToken(), null)
  unsubscribe()
  setAccessToken('another-test-token')
  assert.equal(changes, 2)
  clearAccessToken()
})

test('rejects empty and malformed token values', () => {
  for (const value of [null, undefined, '', ' ', 'test token', 'token\n']) {
    assert.throws(() => setAccessToken(value), TypeError)
  }
})
