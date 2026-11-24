import test from 'node:test'
import assert from 'node:assert/strict'
import { createTokenStore } from '../src/api/createTokenStore.js'
import { createAuthSession } from '../src/contexts/createAuthSession.js'

const now = () => Date.parse('2026-11-23T12:00:00Z')
const expiresAt = '2026-11-23T12:15:00Z'
function fixture() {
  const map = new Map()
  const storage = () => ({
    getItem: (key) => map.get(key),
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  })
  return { map, storage }
}
test('restores only the tab token/expiry; user must be verified through /me before protected content', async () => {
  const { map, storage } = fixture()
  const tokens = createTokenStore({ storage, now })
  tokens.setAccessToken('test-only-token', expiresAt)
  assert.deepEqual(Object.keys(JSON.parse([...map.values()][0])), [
    'accessToken',
    'expiresAt',
  ])
  const restored = createTokenStore({ storage, now })
  let calls = 0
  const auth = createAuthSession({
    tokens: restored,
    getCurrentUser: async () => {
      calls++
      return { id: 'verified-user' }
    },
    revokeSession: async () => {},
  })
  assert.equal(auth.getSnapshot().status, 'checking')
  assert.equal(auth.getSnapshot().user, null)
  assert.equal(auth.getSnapshot().expiresAt, expiresAt)
  await Promise.all([auth.ensureUser(), auth.ensureUser()])
  assert.equal(calls, 1)
  assert.equal(auth.getSnapshot().user.id, 'verified-user')
  await auth.logout()
  assert.equal(map.size, 0)
  assert.equal(createTokenStore({ storage, now }).getAccessToken(), null)
  auth.dispose()
})
test('rejects expired, malformed and missing-expiry saved sessions', () => {
  for (const saved of [
    'invalid json',
    JSON.stringify({
      accessToken: 'test-only-token',
      expiresAt: '2026-11-22T00:00:00Z',
    }),
    JSON.stringify({ accessToken: 'test-only-token' }),
    JSON.stringify({ accessToken: 'invalid token', expiresAt }),
  ]) {
    const { map, storage } = fixture()
    map.set('taskflow.session.v1', saved)
    assert.equal(createTokenStore({ storage, now }).getAccessToken(), null)
    assert.equal(map.size, 0)
  }
})
test('storage denial falls back to memory without crashing or logging credentials', () => {
  const store = createTokenStore({
    storage: () => {
      throw new Error('Blocked')
    },
    now,
  })
  store.setAccessToken('test-only-token', expiresAt)
  assert.equal(store.getAccessToken(), 'test-only-token')
  store.clearAccessToken()
  assert.equal(store.getAccessToken(), null)
})
test('a restored revoked session is cleared when /me returns 401', async () => {
  const { map, storage } = fixture()
  createTokenStore({ storage, now }).setAccessToken(
    'test-only-token',
    expiresAt,
  )
  const tokens = createTokenStore({ storage, now })
  const auth = createAuthSession({
    tokens,
    getCurrentUser: async () => {
      throw { response: { status: 401 } }
    },
    revokeSession: async () => {},
  })
  await auth.ensureUser()
  assert.equal(auth.getSnapshot().status, 'anonymous')
  assert.equal(map.size, 0)
  auth.dispose()
})
test('expired authentication responses cannot be persisted or reported as authenticated', () => {
  const store = createTokenStore({ now })
  assert.throws(() =>
    store.setAccessToken('test-only-token', '2020-01-01T00:00:00Z'),
  )
  assert.equal(store.getAccessToken(), null)
})
