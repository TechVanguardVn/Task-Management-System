import { TaskBoardHeader } from './components/Header/TaskBoardHeader'

export default function TaskBoardPage() {
  return (
    <div className="w-full relative">
      <div className="absolute -top-16 left-1/4 w-[32rem] h-[32rem] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10 transform -translate-x-1/2"></div>
      <div className="absolute top-16 right-8 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute -top-8 right-1/3 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none -z-10"></div>
      
      <TaskBoardHeader />
      
      <div className="bg-white/65 backdrop-blur-2xl border border-white/80 rounded-2xl p-6 shadow-[0_16px_36px_-6px_rgba(15,23,42,0.06),0_4px_16px_-2px_rgba(79,70,229,0.04),inset_0_1px_0_0_rgba(255,255,255,0.9)] min-h-[400px] flex items-center justify-center">
        <span className="text-slate-400 font-medium">Kanban Board Component Placeholder</span>
      </div>
    </div>
  )
}
