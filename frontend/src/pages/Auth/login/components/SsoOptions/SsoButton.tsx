import type { ReactNode } from 'react'

interface SsoButtonProps {
  icon: ReactNode
  label: string
  onClick?: () => void
  disabled?: boolean
}

export function SsoButton({ icon, label, onClick, disabled }: SsoButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '11px 16px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 500,
        letterSpacing: '-0.01em',
        color: '#1d1d1f',
        cursor: 'pointer',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        background: 'rgba(0, 0, 0, 0.03)',
        boxShadow: [
          'inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          '0 1px 2px rgba(0, 0, 0, 0.04)',
        ].join(', '),
        transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.background = 'rgba(0, 0, 0, 0.06)'
        el.style.borderColor = 'rgba(0, 0, 0, 0.12)'
        el.style.transform = 'translateY(-1px)'
        el.style.boxShadow = [
          'inset 0 1px 0 rgba(255, 255, 255, 1)',
          '0 4px 12px rgba(0, 0, 0, 0.08)',
        ].join(', ')
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.background = 'rgba(0, 0, 0, 0.03)'
        el.style.borderColor = 'rgba(0, 0, 0, 0.08)'
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = [
          'inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          '0 1px 2px rgba(0, 0, 0, 0.04)',
        ].join(', ')
      }}
      onMouseDown={e => {
        e.currentTarget.style.transform = 'translateY(0.5px) scale(0.97)'
      }}
      onMouseUp={e => {
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
