import { Button } from '@/app/_components/button'
import { getMembership } from '@/lib/auth/membership'
import { requireUser } from '@/lib/auth/session'
import {
    canMutateBoardContent,
    isActiveMember,
} from '@/lib/domain/authorization'
import { dueDateToIso } from '@/lib/domain/due'
import {
    getActiveColumns,
    getBoard,
} from '@/lib/queries/board'
import { getCardDetail } from '@/lib/queries/card'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
    ArchiveRestoreControls,
    DescriptionField,
    DueDateField,
    PriorityField,
    StatusField,
    TitleField,
} from './card-fields'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ boardId: string; cardId: string }>
}): Promise<Metadata> {
    const { boardId, cardId } = await params
    const detail = await getCardDetail(boardId, cardId)
    return { title: detail?.card.title ?? 'Card' }
}

export default async function CardDetailPage({
    params,
}: {
    params: Promise<{ boardId: string; cardId: string }>
}) {
    const { boardId, cardId } = await params
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
                    You don&apos;t have access to this card
                </h1>
            </div>
        )
    }

    const detail = await getCardDetail(boardId, cardId)
    if (!detail) notFound()

    const activeColumns = await getActiveColumns(boardId)
    const { card } = detail
    const canEdit = canMutateBoardContent(membership)

    return (
        <div className="max-w-5xl flex flex-col gap-4">
            <div>
                <Button
                    href={`/boards/${boardId}`}
                    variant="ghost"
                    className="inline-flex items-center gap-1.5 -ml-2 text-stone-500 hover:text-stone-900 rounded-full px-3 py-1.5"
                >
                    <ArrowLeft size={14} />
                    <span>Back to {board.name}</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
                <div className="bg-[#FAF9F6] border border-stone-200/80 rounded-[24px] p-6 shadow-xs flex flex-col gap-6">
                    <div>
                        <fieldset disabled={!canEdit} className="contents">
                            <TitleField
                                boardId={boardId}
                                cardId={cardId}
                                title={card.title}
                            />
                        </fieldset>
                    </div>

                    <section
                        aria-labelledby="description-heading"
                        className="pt-4 border-t border-stone-200/60"
                    >
                        <h2
                            id="description-heading"
                            className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2"
                        >
                            Description
                        </h2>
                        <fieldset disabled={!canEdit} className="contents">
                            <DescriptionField
                                boardId={boardId}
                                cardId={cardId}
                                description={card.description}
                            />
                        </fieldset>
                    </section>
                </div>

                <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
                    <section
                        aria-labelledby="properties-heading"
                        className="bg-[#FAF9F6] border border-stone-200/80 rounded-[24px] p-5 shadow-xs flex flex-col gap-4"
                    >
                        <h2
                            id="properties-heading"
                            className="text-xs font-semibold text-stone-400 uppercase tracking-wider"
                        >
                            Properties
                        </h2>

                        <fieldset disabled={!canEdit} className="contents">
                            <StatusField
                                boardId={boardId}
                                cardId={cardId}
                                currentColumnId={card.columnId}
                                columns={activeColumns}
                            />
                            <PriorityField
                                boardId={boardId}
                                cardId={cardId}
                                priority={card.priority}
                            />
                            <DueDateField
                                boardId={boardId}
                                cardId={cardId}
                                dueDate={dueDateToIso(card.dueDate)}
                            />
                        </fieldset>
                    </section>

                    {canEdit ? (
                        <section
                            aria-labelledby="archive-heading"
                            className="bg-[#FAF9F6] border border-stone-200/80 rounded-[24px] p-5 shadow-xs"
                        >
                            <h2
                                id="archive-heading"
                                className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3"
                            >
                                Actions
                            </h2>
                            <ArchiveRestoreControls
                                boardId={boardId}
                                cardId={cardId}
                                status={card.status}
                                activeColumns={activeColumns}
                            />
                        </section>
                    ) : null}
                </aside>
            </div>
        </div>
    )
}

export const dynamic = 'force-dynamic'
