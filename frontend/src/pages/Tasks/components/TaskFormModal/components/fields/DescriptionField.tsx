import { Input } from 'antd'

const { TextArea } = Input

interface DescriptionFieldProps {
  value?: string
  onChange: (val: string) => void
}

export const DescriptionField = ({ value, onChange }: DescriptionFieldProps) => {
  return (
    <div className="space-y-1.5">
      <label htmlFor="task-desc" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
        Description
      </label>
      <TextArea 
        id="task-desc" 
        rows={3}
        placeholder="Add detailed notes or acceptance criteria..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        variant="borderless"
        className="w-full text-sm text-slate-700 placeholder-slate-400 !bg-white/70 hover:!bg-white focus:!bg-white !border !border-white/80 !rounded-xl !px-4 !py-3 !shadow-sm transition-all duration-200 outline-none focus:!ring-2 focus:!ring-indigo-500/50 resize-none"
      />
    </div>
  )
}
