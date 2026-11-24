import assert from 'node:assert/strict'
import test from 'node:test'
import { createAuthSession } from '../src/contexts/createAuthSession.js'

// Isolated lifecycle fixtures; no HTTP requests, production accounts or app demo data.
const user = {
  id: 'test-user-id',
  name: 'Trần Huỳnh Minh Kiệt',
  email: 'test@example.invalid',
}
function setup({
  getCurrentUser = async () => user,
  revokeSession = async () => {},
  onLogoutSuccess = () => {},
  onLogoutFailure = () => {},
} = {}) {
  let token = null
  const listeners = new Set()
  const tokens = {
    getAccessToken: () => token,
    setAccessToken: (value) => {
      token = value
      listeners.forEach((listener) => listener())
    },
    clearAccessToken: () => {
      token = null
      listeners.forEach((listener) => listener())
    },
    subscribeToToken: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
  return {
    tokens,
    session: createAuthSession({
      tokens,
      getCurrentUser,
      revokeSession,
      onLogoutSuccess,
      onLogoutFailure,
    }),
  }
}

test('anonymous sessions do not load a user', async () => {
  let calls = 0
  const { session } = setup({
    getCurrentUser: async () => {
      calls++
      return user
    },
  })
  await session.ensureUser()
  assert.equal(session.getSnapshot().status, 'anonymous')
  assert.equal(calls, 0)
  session.dispose()
})

test('logout notification callbacks fire once for confirmed success, never for an already expired session', async () => {
  for (const status of [204, 401, 503]) {
    let successes = 0,
      failures = 0
    const { session } = setup({
      revokeSession: async () => {
        if (status !== 204) throw { response: { status } }
      },
      onLogoutSuccess: () => successes++,
      onLogoutFailure: () => failures++,
    })
    session.completeAuthentication({ accessToken: 'test-only-token', user })
    await Promise.all([session.logout(), session.logout()])
    assert.equal(successes, status === 204 ? 1 : 0)
    assert.equal(failures, status === 503 ? 1 : 0)
    session.dispose()
  }
})

test('login seeds the real response user, avoiding a duplicate /me request', async () => {
  let calls = 0
  const { session, tokens } = setup({
    getCurrentUser: async () => {
      calls++
      return user
    },
  })
  session.completeAuthentication({ accessToken: 'test-only-token', user })
  await session.ensureUser()
  assert.equal(session.getSnapshot().user, user)
  assert.equal(session.getSnapshot().status, 'authenticated')
  assert.equal(tokens.getAccessToken(), 'test-only-token')
  assert.equal(calls, 0)
  session.completeAuthentication({
    accessToken: 'new-test-only-token',
    user: { ...user, name: 'Nguyễn Văn An' },
  })
  assert.equal(session.getSnapshot().user.name, 'Nguyễn Văn An')
  session.dispose()
})

test('deduplicates concurrent current-user requests, including StrictMode effects', async () => {
  let calls = 0
  const { session, tokens } = setup({
    getCurrentUser: async () => {
      calls++
      return user
    },
  })
  tokens.setAccessToken('test-only-token')
  const first = session.ensureUser()
  assert.equal(session.ensureUser(), first)
  await first
  assert.equal(calls, 1)
  assert.equal(session.getSnapshot().user, user)
  session.dispose()
})

test('rejects stale current-user responses after the token changes', async () => {
  let resolve
  const { session, tokens } = setup({
    getCurrentUser: () =>
      new Promise((done) => {
        resolve = done
      }),
  })
  tokens.setAccessToken('old-test-only-token')
  const oldRequest = session.ensureUser()
  await Promise.resolve()
  session.completeAuthentication({
    accessToken: 'new-test-only-token',
    user: { ...user, name: 'Admin' },
  })
  resolve(user)
  await oldRequest
  assert.equal(session.getSnapshot().user.name, 'Admin')
  session.dispose()
})

test('invalid sessions clear both token and user', async () => {
  const { session, tokens } = setup({
    getCurrentUser: async () => {
      throw { response: { status: 401 } }
    },
  })
  tokens.setAccessToken('test-only-token')
  await session.ensureUser()
  assert.equal(tokens.getAccessToken(), null)
  assert.equal(session.getSnapshot().status, 'anonymous')
  assert.equal(session.getSnapshot().user, null)
  session.dispose()
})

test('network failure prevents protected content and permits retry', async () => {
  let calls = 0
  const { session, tokens } = setup({
    getCurrentUser: async () => {
      if (++calls === 1) throw new Error('Test connection failure')
      return user
    },
  })
  tokens.setAccessToken('test-only-token')
  await session.ensureUser()
  assert.equal(session.getSnapshot().status, 'error')
  assert.equal(session.getSnapshot().user, null)
  await session.ensureUser()
  assert.equal(session.getSnapshot().status, 'authenticated')
  session.dispose()
})

test('logout revokes before clearing credentials and deduplicates concurrent calls', async () => {
  let resolve
  let calls = 0
  const { session, tokens } = setup({
    revokeSession: async () => {
      calls++
      assert.equal(tokens.getAccessToken(), 'test-only-token')
      await new Promise((done) => {
        resolve = done
      })
    },
  })
  session.completeAuthentication({ accessToken: 'test-only-token', user })
  const pending = session.logout()
  assert.equal(session.logout(), pending)
  await Promise.resolve()
  assert.equal(session.getSnapshot().status, 'logging-out')
  resolve()
  assert.equal(await pending, true)
  assert.equal(calls, 1)
  assert.equal(tokens.getAccessToken(), null)
  assert.equal(session.getSnapshot().user, null)
  session.dispose()
})

test('an already invalid logout session clears local credentials', async () => {
  const { session, tokens } = setup({
    revokeSession: async () => {
      throw { response: { status: 401 } }
    },
  })
  session.completeAuthentication({ accessToken: 'test-only-token', user })
  assert.equal(await session.logout(), true)
  assert.equal(tokens.getAccessToken(), null)
  session.dispose()
})

test('failed revocation remains visible and retryable without claiming logout succeeded', async () => {
  const { session, tokens } = setup({
    revokeSession: async () => {
      throw new Error('Test connection failure')
    },
  })
  session.completeAuthentication({ accessToken: 'test-only-token', user })
  assert.equal(await session.logout(), false)
  assert.equal(tokens.getAccessToken(), 'test-only-token')
  assert.match(session.getSnapshot().logoutError, /Chưa thể thu hồi/)
  assert.equal(session.getSnapshot().status, 'authenticated')
  session.dispose()
})

test('a late logout response does not clear or redirect a newer session', async () => {
  let resolve
  const { session, tokens } = setup({
    revokeSession: () =>
      new Promise((done) => {
        resolve = done
      }),
  })
  session.completeAuthentication({ accessToken: 'old-test-only-token', user })
  const pending = session.logout()
  await Promise.resolve()
  session.completeAuthentication({
    accessToken: 'new-test-only-token',
    user: { ...user, name: 'Admin' },
  })
  resolve()
  assert.equal(await pending, false)
  assert.equal(tokens.getAccessToken(), 'new-test-only-token')
  assert.equal(session.getSnapshot().user.name, 'Admin')
  session.dispose()
})

test('external 401 token clearing invalidates the cached user', () => {
  const { session, tokens } = setup()
  session.completeAuthentication({ accessToken: 'test-only-token', user })
  tokens.clearAccessToken()
  assert.equal(session.getSnapshot().user, null)
  assert.equal(session.getSnapshot().status, 'anonymous')
  session.dispose()
})
