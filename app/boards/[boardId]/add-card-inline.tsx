'use client'

import { createCardAction } from '@/lib/actions/cards'
import { PlusCircle } from 'lucide-react'
import { useActionState, useRef, useState } from 'react'

export function AddCardInline({
    boardId,
    columnId,
}: {
    boardId: string
    columnId: string
}) {
    const [open, setOpen] = useState(false)
    const boundAction = createCardAction.bind(null, boardId, columnId)
    const [state, formAction] = useActionState(boundAction, undefined)
    const formRef = useRef<HTMLFormElement>(null)

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="w-full text-left flex items-center gap-1.5 text-xs font-medium text-stone-400 hover:text-stone-700 py-2 px-2 rounded-xl hover:bg-stone-200/40 transition-colors cursor-pointer"
            >
                <PlusCircle size={15} className="text-stone-400" />
                <span>Add task</span>
            </button>
        )
    }

    return (
        <form
            ref={formRef}
            action={async (formData) => {
                await formAction(formData)
                formRef.current?.reset()
                setOpen(false)
            }}
            className="flex flex-col gap-2 p-3 bg-white rounded-2xl border border-stone-200/80 shadow-xs mb-2"
        >
            <textarea
                name="title"
                required
                autoFocus
                maxLength={200}
                rows={2}
                placeholder="Task title…"
                className="w-full text-xs text-stone-800 placeholder:text-stone-400 border-none outline-none resize-none p-1"
                onKeyDown={(e) => {
                    if (e.key === 'Escape') setOpen(false)
                }}
            />
            {state?.error ? (
                <p role="alert" className="text-xs text-rose-500 px-1">
                    {state.error}
                </p>
            ) : null}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-100">
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-3 py-1 text-xs text-stone-500 hover:text-stone-800 rounded-full"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-3 py-1 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-full shadow-xs cursor-pointer"
                >
                    Add
                </button>
            </div>
        </form>
    )
}
