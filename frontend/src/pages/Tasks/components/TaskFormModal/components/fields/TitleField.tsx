import { Input } from 'antd'

interface TitleFieldProps {
  value: string
  onChange: (val: string) => void
  error?: string
}

export const TitleField = ({ value, onChange, error }: TitleFieldProps) => {
  return (
    <div className="space-y-1.5">
      <label htmlFor="task-title" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
        Task Title <span className="text-rose-500">*</span>
      </label>
      <div className="relative">
        <Input 
          id="task-title" 
          placeholder="What needs to be done?"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          variant="borderless"
          className="w-full text-lg font-semibold text-slate-800 placeholder-slate-400 !bg-white/80 hover:!bg-white focus:!bg-white !border !border-white/80 !rounded-xl !px-4 !py-3 !shadow-sm transition-all duration-200 outline-none focus:!ring-2 focus:!ring-indigo-500/50"
        />
        {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
      </div>
    </div>
  )
}
