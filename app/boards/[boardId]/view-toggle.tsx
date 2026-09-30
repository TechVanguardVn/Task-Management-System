'use client'

import { AlignLeft } from 'lucide-react'
import Link from 'next/link'

export function ViewToggle({
    boardId,
    view,
    searchParams,
}: {
    boardId: string
    view: 'board' | 'list'
    searchParams: Record<string, string | undefined>
}) {
    const buildHref = (targetView: 'board' | 'list') => {
        const params = new URLSearchParams(
            Object.entries(searchParams).filter(
                (entry): entry is [string, string] =>
                    entry[1] !== undefined && entry[1] !== ''
            )
        )
        if (targetView === 'board') params.delete('view')
        else params.set('view', targetView)
        const qs = params.toString()
        return `/boards/${boardId}${qs ? `?${qs}` : ''}`
    }

    return (
        <div className="flex items-center gap-6 text-xs font-medium border-b border-stone-100 pb-3">
            <Link
                href={buildHref('board')}
                className={`flex items-center gap-1.5 transition-colors relative pb-1 ${
                    view === 'board'
                        ? 'text-orange-600 font-semibold'
                        : 'text-stone-400 hover:text-stone-700'
                }`}
            >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span>Kanban Board</span>
                {view === 'board' && (
                    <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                )}
            </Link>
            <Link
                href={buildHref('list')}
                className={`flex items-center gap-1.5 transition-colors relative pb-1 ${
                    view === 'list'
                        ? 'text-orange-600 font-semibold'
                        : 'text-stone-400 hover:text-stone-700'
                }`}
            >
                <AlignLeft size={14} />
                <span>List View</span>
                {view === 'list' && (
                    <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
                )}
            </Link>
        </div>
    )
}
