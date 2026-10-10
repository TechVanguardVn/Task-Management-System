import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

interface Props {
  children: React.ReactNode
}

export default function GuestRoute({ children }: Props) {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}
