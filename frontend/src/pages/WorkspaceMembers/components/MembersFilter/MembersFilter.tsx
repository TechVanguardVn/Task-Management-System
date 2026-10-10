import { Search } from 'lucide-react'
import { MEMBERS_TEXTS } from '../../constants/members.constants'
import type { MemberRole } from '../../types/members.types'

interface Props {
  searchQuery: string
  onSearchChange: (value: string) => void
  roleFilter: 'all' | MemberRole
  onRoleFilterChange: (role: 'all' | MemberRole) => void
  counts: {
    all: number
    owner: number
    admin: number
    member: number
  }
}

export const MembersFilter = ({ searchQuery, onSearchChange, roleFilter, onRoleFilterChange, counts }: Props) => {
  const tabs = [
    { id: 'all', label: MEMBERS_TEXTS.filter.all, count: counts.all },
    { id: 'OWNER', label: 'Owner', count: counts.owner || 0 },
    { id: 'ADMIN', label: MEMBERS_TEXTS.filter.admin, count: counts.admin },
    { id: 'MEMBER', label: MEMBERS_TEXTS.filter.member, count: counts.member },
  ] as const

  return (
    <div className="p-2 rounded-2xl bg-white/75 backdrop-blur-2xl shadow-[0_8px_28px_-6px_rgba(15,23,42,0.05)] flex flex-col md:flex-row items-center justify-between gap-2 border border-white/80">
      <div className="relative w-full md:w-96 flex items-center">
        <Search size={18} className="absolute left-3.5 text-slate-400" />
        <input 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-10 pl-10 pr-4 bg-slate-50/70 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:bg-white transition-all border border-transparent focus:border-indigo-100" 
          placeholder={MEMBERS_TEXTS.filter.searchPlaceholder}
          type="text" 
        />
      </div>

      <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
        {tabs.map(tab => {
          const isActive = roleFilter === tab.id
          return (
            <button 
              key={tab.id}
              onClick={() => onRoleFilterChange(tab.id as 'all' | MemberRole)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.25)]' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                isActive ? 'bg-white/20 font-bold text-white' : 'bg-slate-200/70 font-semibold text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
