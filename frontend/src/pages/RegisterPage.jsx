import { AuthForm } from '../components/auth/AuthForm.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'

export function RegisterPage() {
  usePageTitle('Đăng ký', 'TaskFlow')
  return <AuthForm mode="register" />
}
