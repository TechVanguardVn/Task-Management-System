'use client'

import { PriorityIcon } from '@/app/_components/priority-icon'
import {
    moveCardAction,
    updateCardAction,
    type CardActionState,
} from '@/lib/actions/cards'
import { isOverdue } from '@/lib/domain/filters'
import { formatDate } from '@/lib/format'
import { columnAccentColor } from '@/lib/labels'
import { PRIORITIES } from '@/lib/priority'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'
import type {
    CardSummary,
    ColumnSummary,
    MemberSummary,
} from './board-types'

gsap.registerPlugin(useGSAP)

function StatusSelect({
    boardId,
    card,
    columns,
    columnIndex,
    canEdit,
    destIndex,
    onMove,
}: {
    boardId: string
    card: CardSummary
    columns: ColumnSummary[]
    columnIndex: number
    canEdit: boolean
    destIndex: (destColumnId: string) => number
    onMove: (cardId: string, destColumnId: string) => void
}) {
    const [, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const accent = columnAccentColor(columnIndex)

    if (!canEdit) {
        return (
            <span
                className="inline-flex items-center gap-1.5 text-[12px] font-medium rounded-[var(--radius-tags)] px-2 py-1 bg-[var(--color-sunken)] text-[var(--color-ink)]"
                title={columns[columnIndex]?.name}
            >
                <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: accent }}
                    aria-hidden="true"
                />
                {columns[columnIndex]?.name}
            </span>
        )
    }

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const destColumnId = e.target.value
        if (destColumnId === card.columnId) return
        const from = card.columnId
        onMove(card.id, destColumnId)
        setError(null)
        startTransition(async () => {
            const result: CardActionState = await moveCardAction(
                boardId,
                card.id,
                destColumnId,
                destIndex(destColumnId)
            )
            if (result?.error) {
                onMove(card.id, from)
                setError(result.error)
            }
        })
    }

    return (
        <span className="relative inline-flex items-center">
            <span
                className="pointer-events-none absolute left-2 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: accent }}
                aria-hidden="true"
            />
            <select
                value={card.columnId}
                onChange={handleChange}
                aria-label={`Move "${card.title}" to a different column`}
                title={error ?? undefined}
                className={`appearance-none text-[12px] font-medium rounded-[var(--radius-tags)] pl-5 pr-6 py-1 cursor-pointer bg-[var(--color-sunken)] text-[var(--color-ink)] hover:bg-[var(--color-mist)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-electric-blue)] ${error ? 'ring-1 ring-[var(--color-coral)]' : ''}`}
            >
                {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                ))}
            </select>
            <ChevronDown
                className="pointer-events-none absolute right-1.5 text-[var(--color-fog)]"
                size={12}
                strokeWidth={2}
                aria-hidden="true"
            />
        </span>
    )
}

function PrioritySelect({
    boardId,
    card,
    canEdit,
    onPatch,
}: {
    boardId: string
    card: CardSummary
    canEdit: boolean
    onPatch: (cardId: string, patch: Partial<CardSummary>) => void
}) {
    const [, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    if (!canEdit) {
        return card.priority ? (
            <PriorityIcon
                priority={card.priority}
                size={13}
                className="shrink-0"
            />
        ) : (
            <span className="text-xs text-[var(--color-fog)]">—</span>
        )
    }

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const value = e.target.value
        const from = card.priority
        onPatch(card.id, { priority: value || null })
        setError(null)
        startTransition(async () => {
            const formData = new FormData()
            formData.set('priority', value)
            const result: CardActionState = await updateCardAction(
                boardId,
                card.id,
                undefined,
                formData
            )
            if (result?.error) {
                onPatch(card.id, { priority: from })
                setError(result.error)
            }
        })
    }

    return (
        <span className="relative inline-flex items-center">
            {card.priority ? (
                <PriorityIcon
                    priority={card.priority}
                    size={13}
                    className="pointer-events-none absolute left-1.5 z-1"
                />
            ) : null}
            <select
                value={card.priority ?? ''}
                onChange={handleChange}
                aria-label={`Set priority for "${card.title}"`}
                title={error ?? undefined}
                className={`appearance-none text-[12px] rounded-[var(--radius-tags)] py-1 pr-6 cursor-pointer bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-sunken)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-electric-blue)] ${card.priority ? 'pl-6' : 'pl-1.5'} ${error ? 'ring-1 ring-[var(--color-coral)]' : ''}`}
            >
                <option value="">No priority</option>
                {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                        {p.label}
                    </option>
                ))}
            </select>
            <ChevronDown
                className="pointer-events-none absolute right-1.5 text-[var(--color-fog)]"
                size={12}
                strokeWidth={2}
                aria-hidden="true"
            />
        </span>
    )
}

function ListRow({
    boardId,
    card,
    columns,
    columnIndex,
    canEdit,
    destIndex,
    onMove,
    onPatch,
}: {
    boardId: string
    card: CardSummary
    columns: ColumnSummary[]
    columnIndex: number
    canEdit: boolean
    destIndex: (destColumnId: string) => number
    onMove: (cardId: string, destColumnId: string) => void
    onPatch: (cardId: string, patch: Partial<CardSummary>) => void
}) {
    const overdue = isOverdue(card.dueDate ? new Date(card.dueDate) : null)

    return (
        <tr className="group border-b border-[var(--color-mist)] last:border-0 hover:bg-[var(--color-sunken)] transition-colors">
            <td className="px-3 py-2.5 align-middle max-w-0 w-full">
                <Link
                    href={`/boards/${boardId}/cards/${card.id}`}
                    className="text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-electric-blue)] truncate block"
                >
                    {card.title}
                </Link>
            </td>
            <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                <StatusSelect
                    boardId={boardId}
                    card={card}
                    columns={columns}
                    columnIndex={columnIndex}
                    canEdit={canEdit}
                    destIndex={destIndex}
                    onMove={onMove}
                />
            </td>
            <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                <PrioritySelect
                    boardId={boardId}
                    card={card}
                    canEdit={canEdit}
                    onPatch={onPatch}
                />
            </td>
            <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                {card.dueDate ? (
                    <span
                        className={
                            overdue
                                ? 'inline-flex items-center gap-1 text-xs rounded-[var(--radius-tags)] px-1.5 py-0.5 bg-[var(--color-blush)] text-[var(--color-coral)] font-semibold'
                                : 'inline-flex items-center gap-1 text-xs text-[var(--color-smoke)]'
                        }
                    >
                        <Calendar
                            size={12}
                            strokeWidth={2}
                            className="shrink-0"
                            aria-hidden="true"
                        />
                        {overdue ? 'Overdue: ' : ''}
                        {formatDate(card.dueDate)}
                    </span>
                ) : (
                    <span className="text-xs text-[var(--color-fog)]">—</span>
                )}
            </td>
        </tr>
    )
}

const HEADERS = [
    'Title',
    'Status',
    'Priority',
    'Due date',
]

export function BoardList({
    boardId,
    columns,
    cardsByColumn,
    canEdit,
}: {
    boardId: string
    columns: ColumnSummary[]
    cardsByColumn: Record<string, CardSummary[]>
    members?: MemberSummary[]
    canEdit: boolean
}) {
    const [localCards, setLocalCards] = useState(cardsByColumn)
    const bodyRef = useRef<HTMLTableSectionElement>(null)

    // Mirrors BoardBoard: re-sync from fresh server props (after any
    // revalidatePath) without clobbering an in-flight optimistic move.
    const [lastFromServer, setLastFromServer] = useState(cardsByColumn)
    if (lastFromServer !== cardsByColumn) {
        setLastFromServer(cardsByColumn)
        setLocalCards(cardsByColumn)
    }

    useGSAP(
        () => {
            if (!bodyRef.current) return
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
                return
            const rows = bodyRef.current.children
            if (rows.length === 0) return
            gsap.from(rows, {
                opacity: 0,
                duration: 0.3,
                stagger: 0.02,
                ease: 'power1.out',
                clearProps: 'opacity',
            })
        },
        { scope: bodyRef, dependencies: [boardId] }
    )

    function handleMove(cardId: string, destColumnId: string) {
        setLocalCards((prev) => {
            const sourceColId = columns.find((c) =>
                prev[c.id]?.some((c2) => c2.id === cardId)
            )?.id
            if (!sourceColId || sourceColId === destColumnId) return prev
            const card = prev[sourceColId].find((c) => c.id === cardId)
            if (!card) return prev
            return {
                ...prev,
                [sourceColId]: prev[sourceColId].filter((c) => c.id !== cardId),
                [destColumnId]: [
                    ...(prev[destColumnId] ?? []),
                    { ...card, columnId: destColumnId },
                ],
            }
        })
    }

    function handlePatch(cardId: string, patch: Partial<CardSummary>) {
        setLocalCards((prev) => {
            const colId = columns.find((c) =>
                prev[c.id]?.some((c2) => c2.id === cardId)
            )?.id
            if (!colId) return prev
            return {
                ...prev,
                [colId]: prev[colId].map((c) =>
                    c.id === cardId ? { ...c, ...patch } : c
                ),
            }
        })
    }

    const [page, setPage] = useState(1)
    const pageSize = 10

    const rows = columns.flatMap((column, columnIndex) =>
        (localCards[column.id] ?? []).map((card) => ({
            card,
            columnIndex,
        }))
    )

    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
    const validPage = Math.min(page, totalPages)
    const paginatedRows = rows.slice((validPage - 1) * pageSize, validPage * pageSize)

    if (rows.length === 0) {
        return (
            <div className="elevated-surface text-center py-16">
                <p className="text-[var(--color-smoke)]">
                    No cards match the current filters.
                </p>
            </div>
        )
    }

    return (
        <div className="elevated-surface overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="border-b border-[var(--color-mist)]">
                        {HEADERS.map((h) => (
                            <th
                                key={h}
                                className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-fog)]"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody ref={bodyRef}>
                    {paginatedRows.map(({ card, columnIndex }) => (
                        <ListRow
                            key={card.id}
                            boardId={boardId}
                            card={card}
                            columns={columns}
                            columnIndex={columnIndex}
                            canEdit={canEdit}
                            destIndex={(destColumnId) =>
                                (localCards[destColumnId] ?? []).length
                            }
                            onMove={handleMove}
                            onPatch={handlePatch}
                        />
                    ))}
                </tbody>
            </table>

            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-mist)] text-xs text-stone-500">
                    <span>
                        Showing {(validPage - 1) * pageSize + 1}–
                        {Math.min(validPage * pageSize, rows.length)} of {rows.length} tasks
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={validPage <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-stone-200 rounded-full text-stone-600 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            <ChevronLeft size={13} />
                            <span>Prev</span>
                        </button>
                        <span className="px-2 font-medium text-stone-700">
                            {validPage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={validPage >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-stone-200 rounded-full text-stone-600 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            <span>Next</span>
                            <ChevronRight size={13} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
