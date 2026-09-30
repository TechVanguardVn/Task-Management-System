'use client'

import {
    FolderKanban,
    LayoutDashboard,
    Search,
    UserRound,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLinks() {
    const pathname = usePathname()

    return (
        <div className="flex flex-col justify-between h-full text-xs font-medium">
            <div className="flex flex-col gap-6">
                <div>
                    <p className="px-3 mb-2 text-[11px] font-semibold text-stone-400 tracking-wider">
                        Menu
                    </p>
                    <nav className="flex flex-col gap-1">
                        <Link
                            href="/boards"
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                                pathname === '/boards'
                                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                            }`}
                        >
                            <LayoutDashboard size={16} strokeWidth={2} />
                            <span>Dashboard</span>
                        </Link>
                        <Link
                            href="/boards"
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                                pathname.startsWith('/boards/') &&
                                !pathname.includes('search') &&
                                !pathname.includes('account')
                                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                            }`}
                        >
                            <FolderKanban size={16} strokeWidth={2} />
                            <span>Kanban Board</span>
                        </Link>
                        <Link
                            href="/boards/search"
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                                pathname.includes('search')
                                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                            }`}
                        >
                            <Search size={16} strokeWidth={2} />
                            <span>Search & Filter</span>
                        </Link>
                    </nav>
                </div>
            </div>

            <div className="pt-4 border-t border-stone-200/60 flex flex-col gap-1">
                <Link
                    href="/boards/account"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                        pathname.includes('account')
                            ? 'bg-white text-stone-900 font-semibold shadow-xs'
                            : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                    }`}
                >
                    <UserRound size={16} strokeWidth={2} />
                    <span>Account</span>
                </Link>
            </div>
        </div>
    )
}
