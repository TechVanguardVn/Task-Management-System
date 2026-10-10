import { useRegisterMutation } from '@/services/queries/auth.query'
import { useNavigate } from 'react-router-dom'
import { App } from 'antd'
import type { RegisterFormValues } from '@/pages/Auth/register/schemas/register.schema'

export function useRegister() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { mutateAsync, isPending } = useRegisterMutation()

  const register = async (values: RegisterFormValues) => {
    await mutateAsync(values)
    message.success('Đăng ký thành công, vui lòng kiểm tra email để xác thực')
    navigate(`/verify-email?email=${encodeURIComponent(values.email)}`)
  }

  return { register, isPending }
}
