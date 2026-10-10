import { DatePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { Calendar } from 'lucide-react'

interface DueDateFieldProps {
  value?: string
  onChange: (val: string) => void
}

export const DueDateField = ({ value, onChange }: DueDateFieldProps) => {
  return (
    <div className="space-y-1.5">
      <label htmlFor="task-due-date" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
        Due Date
      </label>
      <div className="relative flex items-center w-full bg-white/80 border border-white/80 rounded-xl shadow-sm hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
        <div className="absolute left-3.5 z-10 pointer-events-none text-slate-400">
          <Calendar size={16} className="text-indigo-500" />
        </div>
        <DatePicker
          id="task-due-date"
          value={value ? dayjs(value) : null}
          onChange={(date: Dayjs | null) => onChange(date ? date.toISOString() : '')}
          variant="borderless"
          suffixIcon={null}
          className="w-full text-sm font-semibold text-slate-700 pr-3.5 py-2.5 !h-11"
          style={{ paddingLeft: '40px' }}
          format="MMM DD, YYYY"
        />
      </div>
    </div>
  )
}
