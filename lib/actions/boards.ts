'use server'

import { db, schema } from '@/db'
import { requireUser } from '@/lib/auth/session'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { actionErrorMessage, requireOwner } from './helpers'

const createBoardSchema = z.object({
    name: z.string().trim().min(1, 'Board name is required').max(100),
    columnNames: z
        .array(z.string().trim().min(1).max(60))
        .min(1, 'Add at least one column')
        .max(8, 'Up to 8 columns'),
})

export type CreateBoardState = { error?: string } | undefined

export async function createBoardAction(
    _prev: CreateBoardState,
    formData: FormData
): Promise<CreateBoardState> {
    const user = await requireUser()

    const columnNames = formData
        .getAll('columnName')
        .map((v) => String(v).trim())
        .filter(Boolean)

    const parsed = createBoardSchema.safeParse({
        name: formData.get('name'),
        columnNames,
    })
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
    }

    let boardId = ''
    await db.transaction(async (tx) => {
        const [board] = await tx
            .insert(schema.boards)
            .values({ name: parsed.data.name, ownerId: user.id })
            .returning()
        boardId = board.id

        await tx
            .insert(schema.boardMemberships)
            .values({ boardId: board.id, userId: user.id, role: 'owner' })

        await tx.insert(schema.columns).values(
            parsed.data.columnNames.map((name, position) => ({
                boardId: board.id,
                name,
                position,
            }))
        )

    })

    revalidatePath('/boards')
    redirect(`/boards/${boardId}`)
}

const renameBoardSchema = z.object({ name: z.string().trim().min(1).max(100) })

export type SettingsActionState = { error?: string; ok?: boolean } | undefined

export async function renameBoardAction(
    boardId: string,
    _prev: SettingsActionState,
    formData: FormData
): Promise<SettingsActionState> {
    try {
        await requireOwner(boardId)
        const parsed = renameBoardSchema.safeParse({
            name: formData.get('name'),
        })
        if (!parsed.success)
            return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

        await db
            .update(schema.boards)
            .set({ name: parsed.data.name, updatedAt: new Date() })
            .where(eq(schema.boards.id, boardId))

        revalidatePath(`/boards/${boardId}`)
        revalidatePath(`/boards/${boardId}/settings`)
        return { ok: true }
    } catch (err) {
        return { error: actionErrorMessage(err) }
    }
}

export async function closeBoardAction(
    boardId: string
): Promise<SettingsActionState> {
    try {
        await requireOwner(boardId)
        await db
            .update(schema.boards)
            .set({ status: 'closed', closedAt: new Date() })
            .where(eq(schema.boards.id, boardId))
        revalidatePath('/boards')
    } catch (err) {
        return { error: actionErrorMessage(err) }
    }
    redirect('/boards')
}
