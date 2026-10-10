import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/store/slices/authSlice'
import { useLoginMutation } from '@/services/queries/auth.query'
import { useNavigate } from 'react-router-dom'
import { App } from 'antd'
import type { LoginFormValues } from '@/pages/Auth/login/schemas/login.schema'

export function useLogin() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { mutateAsync, isPending } = useLoginMutation()

  const login = async (values: LoginFormValues) => {
    const res = await mutateAsync(values)
    dispatch(setCredentials({
      user: res.data.user,
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    }))
    message.success('Đăng nhập thành công')
    navigate('/dashboard')
  }

  return { login, isPending }
}
