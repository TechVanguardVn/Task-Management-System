import { AuthLayout } from '@/pages/Auth/_shared/components/AuthLayout/AuthLayout'
import { VerifyEmailForm } from './components/VerifyEmailForm/VerifyEmailForm'

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <VerifyEmailForm />
    </AuthLayout>
  )
}
