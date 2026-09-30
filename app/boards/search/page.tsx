import { requireUser } from '@/lib/auth/session'
import { searchBoards, searchCards } from '@/lib/queries/search'
import { ChevronLeft, ChevronRight, LayoutGrid, Search, SquareKanban } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Search' }

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string }>
}) {
    const sp = await searchParams
    const q = sp.q ?? ''
    const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
    const pageSize = 10

    const user = await requireUser()
    const [allCards, boards] = q
        ? await Promise.all([
              searchCards(user.id, q),
              searchBoards(user.id, q),
          ])
        : [[], []]

    const totalResults = allCards.length + boards.length
    const totalPages = Math.max(1, Math.ceil(allCards.length / pageSize))
    const validPage = Math.min(currentPage, totalPages)
    const paginatedCards = allCards.slice(
        (validPage - 1) * pageSize,
        validPage * pageSize
    )

    return (
        <div className="flex flex-col gap-6 max-w-[760px]">
            <div>
                <h1 className="text-xl font-bold tracking-tight text-stone-900">
                    Search
                </h1>
                <p className="text-xs text-stone-400 mt-1">
                    Searches boards and tasks across your projects.
                </p>
            </div>

            <form action="/boards/search" method="GET" className="relative max-w-[440px]">
                <Search
                    size={15}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
                />
                <input
                    type="search"
                    name="q"
                    defaultValue={q}
                    placeholder="Search tasks, boards…"
                    aria-label="Search"
                    autoFocus
                    className="w-full bg-[#FAF9F6] border border-stone-200/80 rounded-full pl-9 pr-4 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 transition-all shadow-2xs"
                />
            </form>

            {q ? (
                totalResults === 0 ? (
                    <div className="bg-[#FAF9F6] rounded-[22px] border border-stone-200/70 text-center py-12">
                        <p className="text-xs text-stone-400">
                            Nothing matches &ldquo;{q}&rdquo;.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {boards.length > 0 ? (
                            <section aria-labelledby="boards-heading">
                                <h2
                                    id="boards-heading"
                                    className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"
                                >
                                    <LayoutGrid
                                        size={13}
                                        strokeWidth={2.2}
                                        aria-hidden="true"
                                    />
                                    Boards ({boards.length})
                                </h2>
                                <div className="bg-[#FAF9F6] border border-stone-200/80 rounded-[20px] overflow-hidden">
                                    <ul className="divide-y divide-stone-200/60">
                                        {boards.map((b) => (
                                            <li key={b.boardId}>
                                                <Link
                                                    href={`/boards/${b.boardId}`}
                                                    className="block px-4 py-2.5 text-xs font-medium text-stone-800 hover:bg-white hover:text-orange-600 transition-colors"
                                                >
                                                    {b.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>
                        ) : null}

                        {allCards.length > 0 ? (
                            <section aria-labelledby="cards-heading">
                                <div className="flex items-center justify-between mb-2">
                                    <h2
                                        id="cards-heading"
                                        className="text-xs font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5"
                                    >
                                        <SquareKanban
                                            size={13}
                                            strokeWidth={2.2}
                                            aria-hidden="true"
                                        />
                                        Cards ({allCards.length})
                                    </h2>
                                    {totalPages > 1 && (
                                        <span className="text-[11px] text-stone-400">
                                            Page {validPage} of {totalPages}
                                        </span>
                                    )}
                                </div>

                                <ul
                                    className="flex flex-col gap-2"
                                    data-testid="search-results"
                                >
                                    {paginatedCards.map((r) => (
                                        <li key={r.cardId}>
                                            <Link
                                                href={`/boards/${r.boardId}/cards/${r.cardId}`}
                                                className="bg-[#FAF9F6] hover:bg-white border border-stone-200/80 hover:border-orange-200 rounded-[18px] flex flex-col gap-1 p-3.5 transition-all shadow-2xs hover:shadow-xs"
                                            >
                                                <span className="text-xs font-bold text-stone-800 hover:text-orange-600 transition-colors">
                                                    {r.title}
                                                    {r.cardStatus === 'archived' ? (
                                                        <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-stone-200 text-stone-500 font-normal">
                                                            archived
                                                        </span>
                                                    ) : null}
                                                </span>
                                                {r.description ? (
                                                    <span className="text-[11px] text-stone-400 line-clamp-2">
                                                        {r.description}
                                                    </span>
                                                ) : null}
                                                <span className="text-[11px] text-stone-400">
                                                    {r.boardName} · {r.columnName}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-3 text-xs">
                                        <span className="text-stone-400 text-[11px]">
                                            Showing {(validPage - 1) * pageSize + 1}–
                                            {Math.min(validPage * pageSize, allCards.length)} of {allCards.length}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {validPage > 1 ? (
                                                <Link
                                                    href={`/boards/search?q=${encodeURIComponent(q)}&page=${validPage - 1}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-stone-200 rounded-full text-stone-600 hover:text-stone-900 transition-colors shadow-2xs"
                                                >
                                                    <ChevronLeft size={13} />
                                                    <span>Prev</span>
                                                </Link>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 rounded-full text-stone-300 cursor-not-allowed">
                                                    <ChevronLeft size={13} />
                                                    <span>Prev</span>
                                                </span>
                                            )}

                                            <span className="px-2 font-medium text-stone-600 text-[11px]">
                                                {validPage} / {totalPages}
                                            </span>

                                            {validPage < totalPages ? (
                                                <Link
                                                    href={`/boards/search?q=${encodeURIComponent(q)}&page=${validPage + 1}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-stone-200 rounded-full text-stone-600 hover:text-stone-900 transition-colors shadow-2xs"
                                                >
                                                    <span>Next</span>
                                                    <ChevronRight size={13} />
                                                </Link>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 rounded-full text-stone-300 cursor-not-allowed">
                                                    <span>Next</span>
                                                    <ChevronRight size={13} />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </section>
                        ) : null}
                    </div>
                )
            ) : null}
        </div>
    )
}

export const dynamic = 'force-dynamic'
