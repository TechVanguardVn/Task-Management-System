import { Button } from '@/app/_components/button'
import { getMembership } from '@/lib/auth/membership'
import { requireUser } from '@/lib/auth/session'
import {
    canMutateBoardContent,
    isActiveMember,
} from '@/lib/domain/authorization'
import { dueDateToIso } from '@/lib/domain/due'
import { matchesFilters } from '@/lib/domain/filters'
import {
    getActiveColumnsWithCards,
    getBoard,
    getBoardMembers,
} from '@/lib/queries/board'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BoardBoard } from './board-board'
import { BoardList } from './board-list'
import type { CardSummary } from './board-types'
import { FilterBar } from './filter-bar'
import { ViewToggle } from './view-toggle'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ boardId: string }>
}): Promise<Metadata> {
    const { boardId } = await params
    const board = await getBoard(boardId)
    return { title: board?.name ?? 'Board' }
}

export default async function BoardPage({
    params,
    searchParams,
}: {
    params: Promise<{ boardId: string }>
    searchParams: Promise<{
        column?: string
        priority?: string
        overdue?: string
        q?: string
        view?: string
    }>
}) {
    const { boardId } = await params
    const sp = await searchParams
    const view = sp.view === 'list' ? 'list' : 'board'
    const user = await requireUser()

    const [board, membership] = await Promise.all([
        getBoard(boardId),
        getMembership(boardId, user.id),
    ])
    if (!board) notFound()
    if (!isActiveMember(membership)) {
        return (
            <div className="card-surface text-center py-16">
                <h1 className="text-[15px] font-normal tracking-[-0.1px] mb-2">
                    You don&apos;t have access to this board
                </h1>
                <p className="text-[var(--color-smoke)]">
                    Check that you are logged in with the account that owns or belongs to this board.
                </p>
            </div>
        )
    }
    if (board.status === 'closed') {
        return (
            <div className="card-surface text-center py-16">
                <h1 className="text-[15px] font-normal tracking-[-0.1px] mb-2">
                    {board.name} is closed
                </h1>
                <p className="text-[var(--color-smoke)]">
                    This board was permanently closed and can no longer be edited.
                </p>
                <Button href="/boards" variant="ghost" className="mt-3">
                    Back to your boards
                </Button>
            </div>
        )
    }

    const [{ columns, cards }, members] = await Promise.all([
        getActiveColumnsWithCards(boardId),
        getBoardMembers(boardId),
    ])

    const people = members.map((m) => ({
        ...m.user,
        role: m.role,
        joinedAt: m.joinedAt,
    }))

    const filters = {
        column: sp.column,
        priority: sp.priority,
        overdue: sp.overdue === '1',
        q: sp.q,
    }
    const filteredCards = cards.filter((c) => matchesFilters(c, filters))

    const cardsByColumn: Record<string, CardSummary[]> = {}
    for (const column of columns) {
        cardsByColumn[column.id] = filteredCards
            .filter((c) => c.columnId === column.id)
            .map((c) => ({
                id: c.id,
                boardId,
                columnId: c.columnId,
                title: c.title,
                description: c.description,
                assigneeId: c.assigneeId,
                dueDate: dueDateToIso(c.dueDate),
                priority: c.priority,
                position: c.position,
            }))
    }

    const canEdit = canMutateBoardContent(membership)

    return (
        <div className="relative flex flex-col gap-6 h-full">
            {/* Top Board Title & Actions */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
                        {board.name}
                    </h1>
                    <p className="text-xs text-stone-400 mt-1 font-normal">
                        Organize and manage your project tasks with Kanban.
                    </p>
                </div>
            </div>

            {/* View Tabs Bar + Filter */}
            <div className="flex flex-col gap-3">
                <ViewToggle boardId={boardId} view={view} searchParams={sp} />

                {(sp.column || sp.priority || sp.overdue || sp.q) ? (
                    <div className="pt-1">
                        <FilterBar
                            boardId={boardId}
                            columns={columns}
                            filters={{ ...sp }}
                        />
                    </div>
                ) : null}
            </div>

            {/* Columns & Tasks Canvas */}
            <div className="flex-1 min-h-0">
                {columns.length === 0 ? (
                    <div className="bg-stone-50 rounded-2xl text-center py-16 border border-dashed border-stone-200">
                        <p className="text-stone-400 text-sm">
                            No active columns in this board.
                        </p>
                    </div>
                ) : view === 'list' ? (
                    <BoardList
                        boardId={boardId}
                        columns={columns}
                        cardsByColumn={cardsByColumn}
                        members={people}
                        canEdit={canEdit}
                    />
                ) : (
                    <BoardBoard
                        boardId={boardId}
                        columns={columns}
                        cardsByColumn={cardsByColumn}
                        members={people}
                        canEdit={canEdit}
                    />
                )}
            </div>
        </div>
    )
}

export const dynamic = 'force-dynamic'
