'use client'

import { moveCardAction, type CardActionState } from '@/lib/actions/cards'
import { formatTaskflowDate } from '@/lib/format'
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCorners,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Calendar } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { AddCardInline } from './add-card-inline'
import type {
    CardSummary,
    ColumnSummary,
    MemberSummary,
} from './board-types'

gsap.registerPlugin(useGSAP)

const AURORA_GRADIENTS = [
    'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-white to-white',
    'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-100/40 via-white to-white',
    'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/45 via-white to-white',
    'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-100/35 via-white to-white',
]

function getAurora(id: string) {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
        hash = (hash + id.charCodeAt(i)) % AURORA_GRADIENTS.length
    }
    return AURORA_GRADIENTS[hash]
}

function CardChip({
    card,
    canEdit,
}: {
    card: CardSummary
    members: MemberSummary[]
    canEdit: boolean
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: card.id,
        data: { columnId: card.columnId },
        disabled: !canEdit,
    })

    const aurora = useMemo(() => getAurora(card.id), [card.id])
    const priorityLabel = card.priority
        ? card.priority.charAt(0).toUpperCase() + card.priority.slice(1)
        : 'Medium'

    return (
        <li
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.35 : 1,
            }}
            {...attributes}
            {...listeners}
            className={`rounded-[22px] p-4.5 mb-3.5 border border-stone-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 relative overflow-hidden group list-none ${aurora} ${
                canEdit ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
        >
            {/* Top row: Due Date and Priority Pill */}
            <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="inline-flex items-center gap-1.5 text-stone-400 font-medium text-[11px]">
                    <Calendar size={13} strokeWidth={1.8} className="text-stone-400" />
                    <span>{formatTaskflowDate(card.dueDate)}</span>
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FFF5ED] text-[#FF6B00] border border-[#FFE7D6] shadow-2xs">
                    {priorityLabel}
                </span>
            </div>

            {/* Title */}
            <Link
                href={`/boards/${card.boardId}/cards/${card.id}`}
                className="text-[14px] font-bold leading-snug text-stone-900 hover:text-orange-600 transition-colors break-words block"
                onClick={(e) => e.stopPropagation()}
            >
                {card.title}
            </Link>

            {/* Description Preview (Mô tả công việc) */}
            {card.description ? (
                <p className="text-xs text-stone-400 line-clamp-2 mt-1.5 font-normal leading-relaxed">
                    {card.description}
                </p>
            ) : null}
        </li>
    )
}

function DroppableColumnBody({
    columnId,
    children,
}: {
    columnId: string
    children: React.ReactNode
}) {
    const { setNodeRef } = useDroppable({
        id: `column-slot:${columnId}`,
        data: { columnId },
    })
    return <div ref={setNodeRef}>{children}</div>
}

function Column({
    column,
    cards,
    members,
    canEdit,
}: {
    column: ColumnSummary
    index: number
    cards: CardSummary[]
    members: MemberSummary[]
    canEdit: boolean
}) {
    const cardIds = cards.map((c) => c.id)

    // Normalize column name to "To Do", "In Progress", "Done"
    const lower = column.name.toLowerCase()
    const displayName =
        lower.includes('progress') || lower.includes('doing')
            ? 'In Progress'
            : lower.includes('done') || lower.includes('complete')
            ? 'Done'
            : lower.includes('todo') || lower.includes('to do')
            ? 'To Do'
            : column.name

    return (
        <div
            data-testid={`column-${column.id}`}
            data-column-name={column.name}
            className="flex flex-col w-[310px] shrink-0 bg-[#F8F7F5] rounded-[26px] p-4 max-h-full min-h-0"
        >
            <div className="flex items-center justify-between mb-3.5 px-1">
                <h3 className="font-bold text-[15px] tracking-tight text-stone-800">
                    {displayName}
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-200/70 text-stone-600">
                    {cards.length}
                </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-0.5 pb-1">
                <SortableContext
                    items={cardIds}
                    strategy={verticalListSortingStrategy}
                >
                    <DroppableColumnBody columnId={column.id}>
                        <ul className="flex flex-col min-h-[40px] p-0 m-0">
                            {cards.map((card) => (
                                <CardChip
                                    key={card.id}
                                    card={card}
                                    members={members}
                                    canEdit={canEdit}
                                />
                            ))}
                        </ul>
                    </DroppableColumnBody>
                </SortableContext>
            </div>

            {canEdit ? (
                <div className="pt-2 shrink-0">
                    <AddCardInline
                        boardId={column.boardId}
                        columnId={column.id}
                    />
                </div>
            ) : null}
        </div>
    )
}

export function BoardBoard({
    boardId,
    columns,
    cardsByColumn,
    members,
    canEdit,
}: {
    boardId: string
    columns: ColumnSummary[]
    cardsByColumn: Record<string, CardSummary[]>
    members: MemberSummary[]
    canManage?: boolean
    canEdit: boolean
}) {
    const [localCards, setLocalCards] = useState(cardsByColumn)
    const [activeCard, setActiveCard] = useState<CardSummary | null>(null)
    const [moveError, setMoveError] = useState<string | null>(null)
    const columnsRef = useRef<HTMLDivElement>(null)

    useGSAP(
        () => {
            if (!columnsRef.current) return
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
                return
            gsap.from(columnsRef.current.children, {
                opacity: 0,
                duration: 0.35,
                stagger: 0.06,
                ease: 'power1.out',
                clearProps: 'opacity',
            })
        },
        { scope: columnsRef, dependencies: [boardId] }
    )

    const [lastFromServer, setLastFromServer] = useState(cardsByColumn)
    if (lastFromServer !== cardsByColumn) {
        setLastFromServer(cardsByColumn)
        setLocalCards(cardsByColumn)
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const allCards = useMemo(
        () => Object.values(localCards).flat(),
        [localCards]
    )

    function findColumnOf(cardId: string): string | undefined {
        return Object.keys(localCards).find((colId) =>
            localCards[colId].some((c) => c.id === cardId)
        )
    }

    function handleDragStart(event: DragStartEvent) {
        const card = allCards.find((c) => c.id === event.active.id)
        setActiveCard(card ?? null)
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveCard(null)
        const { active, over } = event
        if (!over) return

        const sourceColId = findColumnOf(String(active.id))
        if (!sourceColId) return

        let destColId = String(over.id).startsWith('column-slot:')
            ? String(over.id).replace('column-slot:', '')
            : findColumnOf(String(over.id))
        if (!destColId) destColId = sourceColId

        const destList = localCards[destColId] ?? []
        const overIndex = destList.findIndex((c) => c.id === over.id)
        const destIndex = overIndex >= 0 ? overIndex : destList.length

        if (sourceColId === destColId) {
            const list = [...(localCards[sourceColId] ?? [])]
            const from = list.findIndex((c) => c.id === active.id)
            if (from === -1 || from === destIndex) return
            const [moved] = list.splice(from, 1)
            list.splice(destIndex, 0, moved)
            setLocalCards({ ...localCards, [sourceColId]: list })
        } else {
            const sourceList = [...(localCards[sourceColId] ?? [])]
            const from = sourceList.findIndex((c) => c.id === active.id)
            const [moved] = sourceList.splice(from, 1)
            const destListCopy = [...destList]
            destListCopy.splice(destIndex, 0, { ...moved, columnId: destColId })
            setLocalCards({
                ...localCards,
                [sourceColId]: sourceList,
                [destColId]: destListCopy,
            })
        }

        setMoveError(null)
        moveCardAction(boardId, String(active.id), destColId, destIndex).then(
            (result: CardActionState) => {
                if (result?.error) {
                    setLocalCards(cardsByColumn)
                    setMoveError(result.error)
                }
            }
        )
    }

    return (
        <DndContext
            id={`board-dnd-${boardId}`}
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            {moveError ? (
                <p
                    role="alert"
                    className="text-xs text-rose-600 bg-rose-50 rounded-xl px-3 py-2 mb-3"
                >
                    {moveError}
                </p>
            ) : null}
            <div
                ref={columnsRef}
                className="flex flex-1 min-h-0 gap-5 overflow-x-auto pb-4 items-start"
            >
                {columns.map((column, index) => (
                    <Column
                        key={column.id}
                        column={column}
                        index={index}
                        cards={localCards[column.id] ?? []}
                        members={members}
                        canEdit={canEdit}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeCard ? (
                    <div className="w-[300px] p-4.5 bg-white rounded-[22px] shadow-2xl rotate-2 scale-102 border border-stone-200">
                        <p className="text-[15px] font-bold text-stone-900">
                            {activeCard.title}
                        </p>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
