import type { ReactNode, CSSProperties } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function GlassCard({ children, className = '', style }: GlassCardProps) {
  return (
    <div
      className={`w-full max-w-md relative ${className}`}
      style={{ borderRadius: '28px', ...style }}
    >
      <div
        className="relative"
        style={{
          borderRadius: '28px',
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(48px) saturate(180%) brightness(1.02)',
          WebkitBackdropFilter: 'blur(48px) saturate(180%) brightness(1.02)',
          border: '1px solid rgba(255, 255, 255, 0.92)',
          boxShadow: [
            '0 24px 64px -12px rgba(0, 0, 0, 0.14)',
            '0 6px 20px -4px rgba(0, 0, 0, 0.08)',
            '0 1px 4px rgba(0, 0, 0, 0.04)',
            'inset 0 1.5px 0 rgba(255, 255, 255, 1)',
            'inset 0 -0.5px 0 rgba(0, 0, 0, 0.04)',
            'inset 1px 0 0 rgba(255, 255, 255, 0.85)',
            'inset -1px 0 0 rgba(255, 255, 255, 0.7)',
          ].join(', '),
        }}
      >
        <div
          className="absolute top-0 left-6 right-6 pointer-events-none"
          style={{
            height: '1px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 25%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.95) 75%, transparent 100%)',
            borderRadius: '1px',
            zIndex: 2,
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: '28px',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            opacity: 0.025,
            mixBlendMode: 'multiply',
            zIndex: 1,
          }}
        />

        <div className="relative p-8 sm:p-10" style={{ zIndex: 3 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
