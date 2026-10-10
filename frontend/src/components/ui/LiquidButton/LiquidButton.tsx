import type React from 'react'
import { Spin } from 'antd'

interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  children: React.ReactNode
}

export function LiquidButton({ loading, children, className = '', ...props }: LiquidButtonProps) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`liquid-pill-btn w-full py-3 px-6 text-white font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? <Spin size="small" /> : children}
    </button>
  )
}
