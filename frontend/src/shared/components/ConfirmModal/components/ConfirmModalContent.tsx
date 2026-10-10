import type { ReactNode } from 'react'

interface ConfirmModalContentProps {
  content: ReactNode
}

export const ConfirmModalContent = ({ content }: ConfirmModalContentProps) => {
  return (
    <div className="px-6 pb-6 text-center text-slate-500 leading-relaxed">
      {content}
    </div>
  )
}
