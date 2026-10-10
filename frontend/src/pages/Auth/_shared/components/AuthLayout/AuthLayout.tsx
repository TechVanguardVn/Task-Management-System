import type { ReactNode } from 'react'
import { AuthBackground } from '../AuthBackground/AuthBackground'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div
      className="relative min-h-screen w-full antialiased"
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif",
        background: '#f5f5f7',
      }}
    >
      <AuthBackground />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  )
}
