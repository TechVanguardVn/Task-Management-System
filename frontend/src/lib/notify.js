import { toast } from 'sonner'
import { createNotify } from './createNotify.js'

export const notify = createNotify(toast)
export const sessionExpiredToastId = 'session-expired'
export function notifySessionExpired() {
  notify.warning('Phiên đăng nhập đã hết hạn.', {
    id: sessionExpiredToastId,
    description: 'Vui lòng đăng nhập lại để tiếp tục.',
  })
}
if (import.meta.hot) import.meta.hot.dispose(() => notify.dismiss())
