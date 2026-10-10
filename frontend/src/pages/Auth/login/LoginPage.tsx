import { AuthLayout } from '@/pages/Auth/_shared/components/AuthLayout/AuthLayout'
import { LoginForm } from './components/LoginForm/LoginForm'

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}
