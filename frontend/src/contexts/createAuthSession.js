// Framework-independent lifecycle; the existing token store remains authoritative.
export function createAuthSession({
  tokens,
  getCurrentUser,
  revokeSession,
  onLogoutSuccess = () => {},
  onLogoutFailure = () => {},
}) {
  let token = tokens.getAccessToken()
  let snapshot = {
    user: null,
    status: token ? 'checking' : 'anonymous',
    expiresAt: tokens.getExpiresAt?.() || null,
    logoutError: '',
  }
  let pending = null
  let logoutRequest = null
  const listeners = new Set()

  function publish(value) {
    snapshot = { ...snapshot, ...value }
    listeners.forEach((listener) => listener())
  }

  const unsubscribeToken = tokens.subscribeToToken(() => {
    const nextToken = tokens.getAccessToken()
    if (nextToken === token) return
    token = nextToken
    pending?.controller.abort()
    pending = null
    publish({
      user: null,
      status: token ? 'checking' : 'anonymous',
      expiresAt: tokens.getExpiresAt?.() || null,
      logoutError: '',
    })
  })

  function completeAuthentication(data) {
    tokens.setAccessToken(data.accessToken, data.expiresAt || null)
    publish({
      user: data.user || null,
      status: data.user ? 'authenticated' : 'checking',
      expiresAt: data.expiresAt || null,
      logoutError: '',
    })
  }

  function ensureUser() {
    if (!token || snapshot.user || snapshot.status === 'logging-out')
      return Promise.resolve()
    if (pending) return pending.promise
    const requestedToken = token
    const controller = new AbortController()
    publish({ status: 'checking' })
    const promise = Promise.resolve()
      .then(() => getCurrentUser(controller.signal))
      .then((user) => {
        if (token === requestedToken && !controller.signal.aborted)
          publish({ user, status: 'authenticated' })
      })
      .catch((error) => {
        if (token !== requestedToken || controller.signal.aborted) return
        if (error.response?.status === 401) tokens.clearAccessToken()
        else publish({ status: 'error' })
      })
      .finally(() => {
        if (pending?.controller === controller) pending = null
      })
    pending = { controller, promise }
    return promise
  }

  function logout() {
    if (logoutRequest) return logoutRequest
    const requestedToken = token
    if (!requestedToken) return Promise.resolve(true)
    publish({ status: 'logging-out', logoutError: '' })
    logoutRequest = Promise.resolve()
      .then(revokeSession)
      .then(() => {
        if (token !== requestedToken) return !token
        tokens.clearAccessToken()
        onLogoutSuccess()
        return true
      })
      .catch((error) => {
        if (token !== requestedToken) return !token
        if (error.response?.status === 401) {
          tokens.clearAccessToken()
          return true
        }
        publish({
          status: 'authenticated',
          logoutError:
            'Chưa thể thu hồi phiên đăng nhập. Vui lòng kiểm tra kết nối và thử đăng xuất lại.',
        })
        onLogoutFailure()
        return false
      })
      .finally(() => {
        logoutRequest = null
      })
    return logoutRequest
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    completeAuthentication,
    ensureUser,
    logout,
    dispose: () => {
      pending?.controller.abort()
      unsubscribeToken()
      listeners.clear()
    },
  }
}
