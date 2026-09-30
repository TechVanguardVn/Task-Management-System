import { Button } from '@/app/_components/button'
import { getMembership } from '@/lib/auth/membership'
import { requireUser } from '@/lib/auth/session'
import { isActiveMember } from '@/lib/domain/authorization'
import { formatDate } from '@/lib/format'
import { getActiveColumnsWithCards, getBoard } from '@/lib/queries/board'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ boardId: string }>
}): Promise<Metadata> {
    const { boardId } = await params
    const board = await getBoard(boardId)
    return { title: board ? `Dashboard · ${board.name}` : 'Dashboard' }
}

export default async function BoardAnalyticsPage({
    params,
}: {
    params: Promise<{ boardId: string }>
}) {
    const { boardId } = await params
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
                    Check that you are logged in with the account that owns
                    or belongs to this board.
                </p>
            </div>
        )
    }

    const { columns, cards } = await getActiveColumnsWithCards(boardId)

    const columnName = (columnId: string) =>
        columns.find((column) => column.id === columnId)?.name
            .trim()
            .toLowerCase() ?? ''
    const isDone = (columnId: string) =>
        ['done', 'complete', 'completed'].includes(columnName(columnId))
    const isInProgress = (columnId: string) => {
        const name = columnName(columnId)
        return name === 'doing' || name.includes('progress')
    }
    const isToDo = (columnId: string) => {
        const name = columnName(columnId)
        return name === 'todo' || name === 'to do' || name === 'not started'
    }

    const doneCount = cards.filter((card) => isDone(card.columnId)).length
    const inProgressCount = cards.filter((card) =>
        isInProgress(card.columnId)
    ).length
    const toDoCount = cards.filter((card) => isToDo(card.columnId)).length
    const now = new Date()
    const weekFromNow = new Date(now)
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    const upcomingCards = cards
        .filter(
            (card) =>
                card.dueDate &&
                card.dueDate >= now &&
                card.dueDate <= weekFromNow
        )
        .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())
        .slice(0, 8)

    return (
        <div className="flex flex-col gap-6 max-w-[720px]">
            <div>
                <Button href={`/boards/${boardId}`} variant="ghost">
                    &larr; {board.name}
                </Button>
                <h1 className="text-[16px] font-medium tracking-[-0.2px] mt-1">
                    Dashboard
                </h1>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    ['Total tasks', cards.length],
                    ['To do', toDoCount],
                    ['In progress', inProgressCount],
                    ['Done', doneCount],
                ].map(([label, value]) => (
                    <div key={label} className="card-surface">
                        <p className="eyebrow">{label}</p>
                        <p className="tabular text-[16px] font-medium mt-1">
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            <section className="card-surface">
                <h2 className="eyebrow mb-3">Due in the next 7 days</h2>
                {upcomingCards.length > 0 ? (
                    <ul className="divide-y divide-[var(--color-mist)]">
                        {upcomingCards.map((card) => (
                            <li
                                key={card.id}
                                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                            >
                                <a
                                    href={`/boards/${boardId}/cards/${card.id}`}
                                    className="min-w-0 truncate text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-electric-blue)]"
                                >
                                    {card.title}
                                </a>
                                <time
                                    dateTime={card.dueDate!.toISOString()}
                                    className="shrink-0 text-xs text-[var(--color-smoke)]"
                                >
                                    {formatDate(card.dueDate!)}
                                </time>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-[var(--color-fog)]">
                        No tasks due this week.
                    </p>
                )}
            </section>
        </div>
    )
}

export const dynamic = 'force-dynamic'
