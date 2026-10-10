import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon = 'inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="material-symbols-outlined text-6xl text-slate-300">{icon}</span>
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold text-slate-600">{title}</p>
        {description && <p className="text-sm text-slate-400 max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  )
}
