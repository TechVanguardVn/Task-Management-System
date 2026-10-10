import { Lock } from 'lucide-react'

interface CardLockProps {
  isLocked: boolean
}

export const CardLock = ({ isLocked }: CardLockProps) => {
  if (!isLocked) return null

  return (
    <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-100 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center shadow-sm z-20" title="This task is being worked on">
      <Lock size={12} />
    </div>
  )
}
