import type { ReactNode } from 'react'

interface FormFieldLabelProps {
  label: string
  rightSlot?: ReactNode
}

export function FormFieldLabel({ label, rightSlot }: FormFieldLabelProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'rgba(60, 60, 67, 0.7)',
          letterSpacing: '-0.005em',
        }}
      >
        {label}
      </span>
      {rightSlot}
    </div>
  )
}

