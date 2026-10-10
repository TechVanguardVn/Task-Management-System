import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { clearAuth } from '@/store/slices/authSlice'
import { useLogoutMutation, useLogoutAllMutation } from '@/services/queries/auth.query'
import { useNavigate } from 'react-router-dom'
import { App } from 'antd'

export function useLogout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const refreshToken = useAppSelector(state => state.auth.refreshToken)
  const { mutateAsync: logoutMutation } = useLogoutMutation()
  const { mutateAsync: logoutAllMutation } = useLogoutAllMutation()

  const logout = async () => {
    await logoutMutation(refreshToken ?? '')
    dispatch(clearAuth())
    message.success('Đã đăng xuất')
    navigate('/login')
  }

  const logoutAll = async () => {
    await logoutAllMutation()
    dispatch(clearAuth())
    message.success('Đã đăng xuất tất cả thiết bị')
    navigate('/login')
  }

  return { logout, logoutAll }
}
