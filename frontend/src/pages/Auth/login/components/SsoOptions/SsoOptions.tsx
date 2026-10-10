import { SsoButton } from './SsoButton'
import { useGoogleAuth } from '../../hooks/useGoogleAuth'
import { App as AntApp } from 'antd'

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1d1d1f">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.12.64-2.79 1.43-.59.69-.99 1.76-.94 2.81 1.07.08 2.12-.59 2.72-1.37z" />
  </svg>
)

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z" fill="#EA4335" />
    <path d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" fill="#4285F4" />
    <path d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.9 6.4C.7 8.8 0 10.3 0 12s.7 3.2 1.9 5.6l3.7-2.9z" fill="#FBBC05" />
    <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16C3.7 19.8 7.5 23 12 23z" fill="#34A853" />
  </svg>
)

export function SsoOptions() {
  const { message } = AntApp.useApp()
  const { loginGoogle, isPending } = useGoogleAuth()

  return (
    <div className="grid grid-cols-2 gap-3">
      <SsoButton icon={<AppleIcon />} label="Apple" onClick={() => message.info('Đang phát triển')} disabled={isPending} />
      <SsoButton icon={<GoogleIcon />} label="Google" onClick={() => loginGoogle()} disabled={isPending} />
    </div>
  )
}

