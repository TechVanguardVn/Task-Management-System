import { Building2 } from 'lucide-react'

interface NameFieldProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export const NameField = ({ value, onChange, error }: NameFieldProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
        Workspace Name <span className="text-red-500">*</span>
      </label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
          <Building2 size={16} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Nexus Core"
          className={`w-full bg-white/50 border pl-10 pr-4 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-[inset_0_1px_2px_rgba(15,23,42,0.02)] ${
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
