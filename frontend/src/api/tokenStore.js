import { createTokenStore } from './createTokenStore.js'

const store = createTokenStore({
  storage: () => window.sessionStorage,
  key: `taskflow.session.v1:${import.meta.env?.VITE_API_BASE_URL || 'local'}`,
})
export const {
  getAccessToken,
  getExpiresAt,
  setAccessToken,
  clearAccessToken,
  subscribeToToken,
} = store
