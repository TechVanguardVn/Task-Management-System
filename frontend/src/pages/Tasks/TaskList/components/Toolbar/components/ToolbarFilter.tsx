import { Select } from 'antd'
import type { LucideIcon } from 'lucide-react'

interface ToolbarFilterProps {
  icon: LucideIcon
  iconColorClass: string
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
}

export const ToolbarFilter = ({ icon: Icon, iconColorClass, options, value, onChange }: ToolbarFilterProps) => {
  return (
    <div className="relative bg-white/80 hover:bg-white text-slate-900 rounded-xl text-sm font-semibold flex items-center shadow-[0_4px_16px_-2px_rgba(15,23,42,0.03)] hover:scale-[1.01] active:scale-[0.99] transition-all min-w-[140px]">
      <div className="absolute left-3 z-10 pointer-events-none flex items-center">
        <Icon size={18} className={iconColorClass} />
      </div>
      <Select
        value={value}
        onChange={onChange}
        variant="borderless"
        className="w-full !pl-8"
        dropdownStyle={{ borderRadius: '12px', padding: '8px' }}
        options={options}
      />
    </div>
  )
}
