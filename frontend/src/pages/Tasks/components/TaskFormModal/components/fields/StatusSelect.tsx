import { Select } from 'antd'
import { TASK_STATUS_OPTIONS } from '../../../../constants/task.constants'

interface StatusSelectProps {
  value: string
  onChange: (val: string) => void
}

export const StatusSelect = ({ value, onChange }: StatusSelectProps) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Status</label>
      <div className="w-full bg-white/80 border border-white/80 rounded-xl shadow-sm hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all flex items-center">
        <Select
          value={value}
          onChange={onChange}
          variant="borderless"
          className="w-full !h-11"
          dropdownStyle={{ borderRadius: '12px', padding: '8px' }}
          options={[...TASK_STATUS_OPTIONS]}
        />
      </div>
    </div>
  )
}
