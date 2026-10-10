import type { ReactNode } from 'react'

interface ConfirmModalLayoutProps {
  isOpen: boolean
  children: ReactNode
}

export const ConfirmModalLayout = ({ isOpen, children }: ConfirmModalLayoutProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div 
        className="relative w-full max-w-sm bg-white/70 backdrop-blur-3xl border border-white/80 rounded-3xl shadow-[0_24px_48px_-12px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.95)] overflow-hidden transform transition-all duration-300 scale-100 opacity-100"
      >
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none"></div>
        {children}
      </div>
    </div>
  )
}
