import { AlignLeft } from 'lucide-react'

interface DescriptionFieldProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export const DescriptionField = ({ value, onChange, error }: DescriptionFieldProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
        Description (Optional)
      </label>
      <div className="relative group">
        <div className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
          <AlignLeft size={16} />
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="What is this workspace for?"
          rows={3}
          className={`w-full bg-white/50 border pl-10 pr-4 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] resize-none ${
            error 
              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
              : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-500 ml-1 mt-0.5 font-medium">{error}</p>}
    </div>
  )
}
