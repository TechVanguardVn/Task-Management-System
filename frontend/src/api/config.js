export function validateApiBaseUrl(value) {
  if (!value?.trim()) {
    throw new Error('Set VITE_API_BASE_URL using frontend/.env.example.')
  }

  let url
  try {
    url = new URL(value.trim())
  } catch {
    throw new Error('VITE_API_BASE_URL must be a valid HTTP(S) origin.')
  }

  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (
    (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  ) {
    throw new Error(
      'VITE_API_BASE_URL must be an HTTPS origin (HTTP allowed on localhost), without credentials, path, query, or fragment.',
    )
  }

  return url.origin
}
