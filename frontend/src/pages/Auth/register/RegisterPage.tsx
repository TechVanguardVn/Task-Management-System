import { AuthLayout } from '@/pages/Auth/_shared/components/AuthLayout/AuthLayout'
import { RegisterForm } from './components/RegisterForm/RegisterForm'

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  )
}
