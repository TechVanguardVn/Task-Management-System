import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setUnauthorizedHandler } from '../api/client'
import type { AuthResponse, User } from '../types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  signIn: (payload: AuthResponse) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) as User : null
  })
  const signOut = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }, [navigate])

  useEffect(() => setUnauthorizedHandler(signOut), [signOut])

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user && localStorage.getItem('token')),
    signIn: (payload: AuthResponse) => {
      localStorage.setItem('token', payload.token)
      localStorage.setItem('user', JSON.stringify(payload.user))
      setUser(payload.user)
    },
    signOut,
  }), [signOut, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
