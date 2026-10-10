import { useGoogleLogin } from '@react-oauth/google'
import { App as AntApp } from 'antd'
import { useNavigate } from 'react-router-dom'
import { setCredentials } from '@/store/slices/authSlice'
import { useAppDispatch } from '@/store/hooks'
import { useGoogleLoginMutation } from '@/services/queries/auth.query'

export function useGoogleAuth() {
  const { message } = AntApp.useApp()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { mutateAsync, isPending } = useGoogleLoginMutation()

  const loginGoogle = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        const data = await mutateAsync({ code: codeResponse.code })
        
        dispatch(setCredentials({ 
          accessToken: data.data.accessToken, 
          refreshToken: data.data.refreshToken, 
          user: data.data.user 
        }))
        
        message.success('Đăng nhập Google thành công')
        navigate('/dashboard')
      } catch (err: any) {
        message.error(err.message || 'Đăng nhập Google thất bại')
      }
    },
    onError: errorResponse => {
      message.error('Lỗi khi đăng nhập Google')
      console.error(errorResponse)
    }
  })

  return { loginGoogle, isPending }
}
