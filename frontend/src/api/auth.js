import { queryClient, scopedKey } from '../query/client.js'
import { keys } from '../query/keys.js'
import { apiClient } from './client.js'

export async function authenticate(mode, values, signal) {
  const body = {
    email: values.email.trim().toLowerCase(),
    password: values.password,
  }
  if (mode === 'register') body.name = values.name.trim()
  const path = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
  const { data } = await apiClient.post(path, body, { signal })
  return data
}

export async function getCurrentUser(signal) {
  return queryClient.fetchQuery({
    queryKey: scopedKey(keys.user),
    queryFn: async ({ signal: querySignal }) =>
      (
        await apiClient.get('/api/auth/me', {
          signal: signal ? AbortSignal.any([signal, querySignal]) : querySignal,
        })
      ).data,
  })
}

export async function revokeSession() {
  await apiClient.post('/api/auth/logout')
}
