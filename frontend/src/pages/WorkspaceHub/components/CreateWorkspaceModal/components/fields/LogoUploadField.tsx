import { UploadCloud } from 'lucide-react'

export const LogoUploadField = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer">
        <UploadCloud size={24} />
        <span className="text-[10px] font-semibold uppercase tracking-widest mt-1">Logo</span>
      </div>
    </div>
  )
}
