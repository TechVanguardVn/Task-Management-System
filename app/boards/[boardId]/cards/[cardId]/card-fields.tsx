'use client'

import { PriorityIcon } from '@/app/_components/priority-icon'
import {
    deleteCardAction,
    moveCardAction,
    updateCardAction,
    type CardActionState,
} from '@/lib/actions/cards'
import { MAX_DUE_YEAR, MIN_DUE_YEAR } from '@/lib/domain/due'
import { renderMarkdownLite } from '@/lib/markdown'
import { PRIORITIES } from '@/lib/priority'
import { useRouter } from 'next/navigation'
import { useActionState, useState } from 'react'
import { Button } from '../../../../_components/button'

export function TitleField({
    boardId,
    cardId,
    title,
}: {
    boardId: string
    cardId: string
    title: string
}) {
    const boundAction = updateCardAction.bind(null, boardId, cardId)
    const [state, formAction] = useActionState(boundAction, undefined)
    const [value, setValue] = useState(title)

    return (
        <form
            action={formAction}
            onBlur={(e) => {
                if (value.trim() && value !== title)
                    e.currentTarget.requestSubmit()
            }}
        >
            <label htmlFor="title" className="sr-only">
                Card title
            </label>
            <textarea
                id="title"
                name="title"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                maxLength={200}
                rows={1}
                className="text-[15px] font-medium tracking-[-0.1px] w-full resize-none border-none outline-none bg-transparent focus-visible:outline-2 focus-visible:outline-[var(--color-electric-blue)] rounded"
            />
            {state?.error ? (
                <p
                    role="alert"
                    className="text-sm text-[var(--color-coral)] mt-1"
                >
                    {state.error}
                </p>
            ) : null}
        </form>
    )
}

export function DescriptionField({
    boardId,
    cardId,
    description,
}: {
    boardId: string
    cardId: string
    description: string
}) {
    const boundAction = updateCardAction.bind(null, boardId, cardId)
    const [state, formAction] = useActionState(boundAction, undefined)
    const [editing, setEditing] = useState(false)
    const [value, setValue] = useState(description)

    if (!editing) {
        return (
            <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-left w-full text-sm text-[var(--color-ink)] rounded-lg p-2 -m-2 hover:bg-[var(--color-snow)]"
            >
                {description ? (
                    <span
                        dangerouslySetInnerHTML={{
                            __html: renderMarkdownLite(description),
                        }}
                    />
                ) : (
                    <span className="text-[var(--color-fog)]">
                        Add a description…
                    </span>
                )}
            </button>
        )
    }

    return (
        <form
            action={(formData) => {
                formAction(formData)
                setEditing(false)
            }}
            className="flex flex-col gap-2"
        >
            <label htmlFor="description" className="sr-only">
                Description
            </label>
            <textarea
                id="description"
                name="description"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={6}
                autoFocus
                className="input"
                placeholder="Add more detail. Supports **bold**, *italic*, `code`, and links."
            />
            {state?.error ? (
                <p role="alert" className="text-sm text-[var(--color-coral)]">
                    {state.error}
                </p>
            ) : null}
            <div className="flex gap-2">
                <Button type="submit" variant="primary">
                    Save
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                </Button>
            </div>
        </form>
    )
}

export function StatusField({
    boardId,
    cardId,
    currentColumnId,
    columns,
}: {
    boardId: string
    cardId: string
    currentColumnId: string
    columns: { id: string; name: string }[]
}) {
    const [error, setError] = useState<string | null>(null)
    const [columnId, setColumnId] = useState(currentColumnId)
    const router = useRouter()

    async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const nextId = e.target.value
        setColumnId(nextId)
        setError(null)
        const result = await moveCardAction(boardId, cardId, nextId, 0)
        if (result?.error) {
            setError(result.error)
            setColumnId(currentColumnId)
        } else {
            router.refresh()
        }
    }

    return (
        <div className="flex flex-col gap-1">
            <label
                htmlFor="status"
                className="text-xs font-medium text-[var(--color-fog)] uppercase tracking-wide"
            >
                Status
            </label>
            <select
                id="status"
                value={columnId}
                onChange={handleChange}
                className="input"
            >
                {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                        {col.name}
                    </option>
                ))}
            </select>
            {error ? (
                <p role="alert" className="text-xs text-[var(--color-coral)]">
                    {error}
                </p>
            ) : null}
        </div>
    )
}

export function PriorityField({
    boardId,
    cardId,
    priority,
}: {
    boardId: string
    cardId: string
    priority: string | null
}) {
    const boundAction = updateCardAction.bind(null, boardId, cardId)
    const [state, formAction] = useActionState(boundAction, undefined)

    return (
        <form action={formAction} className="flex flex-col gap-1">
            <label
                htmlFor="priority"
                className="text-xs font-medium text-[var(--color-fog)] uppercase tracking-wide"
            >
                Priority
            </label>
            <div className="relative">
                <select
                    id="priority"
                    name="priority"
                    defaultValue={priority ?? ''}
                    className={`input ${priority ? 'pl-8' : ''}`}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                >
                    <option value="">No priority</option>
                    {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>
                            {p.label}
                        </option>
                    ))}
                </select>
                {priority ? (
                    <PriorityIcon
                        priority={priority}
                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
                    />
                ) : null}
            </div>
            {state?.error ? (
                <p role="alert" className="text-xs text-[var(--color-coral)]">
                    {state.error}
                </p>
            ) : null}
        </form>
    )
}

export function DueDateField({
    boardId,
    cardId,
    dueDate,
}: {
    boardId: string
    cardId: string
    dueDate: string | null
}) {
    const boundAction = updateCardAction.bind(null, boardId, cardId)
    const [state, formAction] = useActionState(boundAction, undefined)
    const initial = dueDate ? dueDate.slice(0, 10) : ''

    return (
        <form action={formAction} className="flex flex-col gap-1">
            <label
                htmlFor="dueDate"
                className="text-xs font-medium text-[var(--color-fog)] uppercase tracking-wide"
            >
                Due date
            </label>
            <input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={initial}
                // Mirrors the server-side range in lib/domain/due.ts — a date
                // picker will happily emit year 0022 from a typo otherwise.
                min={`${MIN_DUE_YEAR}-01-01`}
                max={`${MAX_DUE_YEAR}-12-31`}
                className="input"
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
            />
            {state?.error ? (
                <p role="alert" className="text-xs text-[var(--color-coral)]">
                    {state.error}
                </p>
            ) : null}
        </form>
    )
}

export function ArchiveRestoreControls({
    boardId,
    cardId,
}: {
    boardId: string
    cardId: string
    status?: string
    activeColumns?: { id: string; name: string }[]
}) {
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const router = useRouter()

    async function handleDelete() {
        if (
            !window.confirm('Are you sure you want to permanently delete this task?')
        )
            return
        setBusy(true)
        const result: CardActionState = await deleteCardAction(boardId, cardId)
        if (result?.error) {
            setError(result.error)
            setBusy(false)
        } else {
            router.push(`/boards/${boardId}`)
        }
    }

    return (
        <div className="flex flex-col gap-2">
            {error ? (
                <p role="alert" className="text-sm text-[var(--color-coral)]">
                    {error}
                </p>
            ) : null}
            <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={busy}
                className="w-full justify-center"
            >
                Delete task
            </Button>
        </div>
    )
}
