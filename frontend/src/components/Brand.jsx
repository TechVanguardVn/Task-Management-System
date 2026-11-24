import { Link } from 'react-router'
import mark from '../assets/mark.svg'

export function Brand() {
  return (
    <Link
      to="/dashboard"
      className="flex items-center gap-3 font-semibold tracking-tight text-slate-900"
    >
      <img src={mark} alt="" width="36" height="36" />
      <span>
        Task Management
        <span className="block text-xs font-normal tracking-normal text-slate-500">
          Your personal workspace
        </span>
      </span>
    </Link>
  )
}
