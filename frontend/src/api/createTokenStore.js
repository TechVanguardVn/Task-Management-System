export function createTokenStore({
  storage = () => null,
  key = 'taskflow.session.v1',
  now = Date.now,
} = {}) {
  const listeners = new Set()
  const remove = () => {
    try {
      storage()?.removeItem(key)
    } catch {
      /* Storage can be blocked by the browser. */
    }
  }
  let session = { accessToken: null, expiresAt: null }
  try {
    const saved = JSON.parse(storage()?.getItem(key) || 'null')
    if (
      typeof saved?.accessToken === 'string' &&
      saved.accessToken.trim() &&
      !/\s/.test(saved.accessToken) &&
      typeof saved.expiresAt === 'string' &&
      Date.parse(saved.expiresAt) > now()
    )
      session = { accessToken: saved.accessToken, expiresAt: saved.expiresAt }
    else remove()
  } catch {
    remove()
  }
  function update(accessToken, expiresAt) {
    if (session.accessToken === accessToken && session.expiresAt === expiresAt)
      return
    session = { accessToken, expiresAt }
    try {
      if (accessToken && expiresAt)
        storage()?.setItem(key, JSON.stringify(session))
      else remove()
    } catch {
      remove()
    }
    listeners.forEach((listener) => listener())
  }
  return {
    getAccessToken: () => session.accessToken,
    getExpiresAt: () => session.expiresAt,
    setAccessToken(token, expiresAt = null) {
      if (typeof token !== 'string' || !token.trim() || /\s/.test(token))
        throw new TypeError(
          'An access token must be a nonempty string without whitespace.',
        )
      if (
        expiresAt !== null &&
        (typeof expiresAt !== 'string' ||
          !Number.isFinite(Date.parse(expiresAt)) ||
          Date.parse(expiresAt) <= now())
      )
        throw new TypeError('The session expiration must be in the future.')
      update(token, expiresAt)
    },
    clearAccessToken: () => update(null, null),
    subscribeToToken(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
