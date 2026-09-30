import { TaskflowMark } from '@/app/_components/brand-mark'
import { getCurrentUser } from '@/lib/auth/session'
import { Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { NavLinks } from './nav-links'
import { UserMenu } from './user-menu'

export const metadata: Metadata = {
    title: 'Taskflow',
    robots: { index: false, follow: false },
}

export default async function BoardsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    return (
        <div className="h-screen flex bg-snow text-stone-800 antialiased overflow-hidden selection:bg-orange-500/20">
            {/* Left Sidebar */}
            <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 bg-snow px-4 py-5 justify-between">
                <div>
                    <Link
                        href="/boards"
                        className="flex items-center gap-2.5 px-3 mb-6"
                    >
                        <TaskflowMark className="w-7 h-7 shrink-0 shadow-sm shadow-orange-500/20" />
                        <span className="font-bold text-[17px] tracking-tight text-stone-900">
                            Taskflow
                        </span>
                    </Link>
                </div>
                <div className="flex-1 min-h-0">
                    <NavLinks />
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 min-w-0 flex flex-col h-screen bg-snow">
                {/* Top Header */}
                <header className="sticky top-0 z-10 shrink-0 h-16 px-6 md:px-8 flex items-center justify-between">
                    <div className="md:hidden flex items-center gap-2">
                        <TaskflowMark className="w-6 h-6" />
                        <span className="font-bold text-base text-stone-900">
                            Taskflow
                        </span>
                    </div>
                    <div className="hidden md:block" />

                    <div className="flex items-center gap-3">
                        <form
                            action="/boards/search"
                            method="GET"
                            className="relative w-56 sm:w-64 md:w-72"
                        >
                            <Search
                                size={14}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                            />
                            <input
                                type="search"
                                name="q"
                                placeholder="Search"
                                className="w-full bg-white/90 border border-stone-200/80 rounded-full pl-9 pr-4 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 shadow-xs transition-all"
                            />
                        </form>

                        <UserMenu name={user.name} email={user.email} />
                    </div>
                </header>

                {/* White Curved Content Canvas */}
                <main className="flex-1 min-h-0 bg-white rounded-tl-[32px] md:rounded-tl-[36px] shadow-[0_-4px_24px_rgba(0,0,0,0.02)] p-6 md:p-8 overflow-y-auto overscroll-y-contain flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    )
}
