import { AuthForm } from '../components/auth/AuthForm.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'

export function LoginPage() {
  usePageTitle('Đăng nhập', 'TaskFlow')
  return <AuthForm mode="login" />
}
