import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setUser, clearAuth } from '@/store/slices/authSlice'
import { getMeAPI } from '@/services/apis/auth.api'

interface Props {
  children: React.ReactNode
}

export default function AuthInitializer({ children }: Props) {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector(state => state.auth.accessToken)

  useEffect(() => {
    if (!accessToken) return

    getMeAPI()
      .then(res => dispatch(setUser(res.data)))
      .catch(() => dispatch(clearAuth()))
  }, [accessToken, dispatch])

  return <>{children}</>
}
