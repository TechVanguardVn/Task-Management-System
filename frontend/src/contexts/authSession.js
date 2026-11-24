import * as tokens from '../api/tokenStore.js'
import { getCurrentUser, revokeSession } from '../api/auth.js'
import { createAuthSession } from './createAuthSession.js'
import { notify } from '../lib/notify.js'

export const authSession = createAuthSession({
  tokens,
  getCurrentUser,
  revokeSession,
  onLogoutSuccess: () => notify.success('Đăng xuất thành công.'),
  onLogoutFailure: () => notify.error('Chưa thể đăng xuất. Vui lòng thử lại.'),
})

if (import.meta.hot) import.meta.hot.dispose(() => authSession.dispose())
