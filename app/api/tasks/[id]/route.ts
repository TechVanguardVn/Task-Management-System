import { NextResponse } from 'next/server'
import { and, asc, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db'
import { getCurrentUser } from '@/lib/auth/session'
import { requireContentEditor, requireMembership } from '@/lib/actions/helpers'
import { nextPosition } from '@/lib/domain/positions'
import {
    findMatchingColumn,
    formatTaskJson,
    taskPriorityValues,
    taskStatusValues,
    toDbPriority,
} from '@/lib/domain/tasks'

const updateTaskSchema = z.object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(10000).optional(),
    status: z.enum(taskStatusValues).optional(),
    priority: z.enum(taskPriorityValues).optional(),
    dueDate: z.string().datetime({ offset: true }).nullable().optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login first.' },
                { status: 401 }
            )
        }

        const { id } = await params

        const [row] = await db
            .select({
                card: schema.cards,
                columnName: schema.columns.name,
            })
            .from(schema.cards)
            .innerJoin(schema.columns, eq(schema.columns.id, schema.cards.columnId))
            .where(eq(schema.cards.id, id))
            .limit(1)

        if (!row) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        // Verify that the user is an active member of this board
        try {
            await requireMembership(row.card.boardId)
        } catch {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        return NextResponse.json(formatTaskJson(row.card, row.columnName))
    } catch (err) {
        console.error('Error fetching task details:', err)
        return NextResponse.json(
            { error: 'Failed to retrieve task' },
            { status: 500 }
        )
    }
}

export async function PATCH(req: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login first.' },
                { status: 401 }
            )
        }

        const { id } = await params
        const body = await req.json()
        const parsed = updateTaskSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? 'Invalid request data' },
                { status: 400 }
            )
        }

        const [existing] = await db
            .select()
            .from(schema.cards)
            .where(eq(schema.cards.id, id))
            .limit(1)

        if (!existing) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        // Verify editor permissions
        try {
            await requireContentEditor(existing.boardId)
        } catch {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const updates: Partial<typeof schema.cards.$inferInsert> = {
            updatedAt: new Date(),
        }

        if (parsed.data.title !== undefined) {
            updates.title = parsed.data.title
        }
        if (parsed.data.description !== undefined) {
            updates.description = parsed.data.description
        }
        if (parsed.data.priority !== undefined) {
            updates.priority = toDbPriority(parsed.data.priority)
        }
        if (parsed.data.dueDate !== undefined) {
            updates.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null
        }

        let targetColumnName: string | null = null

        if (parsed.data.status !== undefined) {
            const boardColumns = await db
                .select()
                .from(schema.columns)
                .where(
                    and(
                        eq(schema.columns.boardId, existing.boardId),
                        eq(schema.columns.status, 'active')
                    )
                )
                .orderBy(asc(schema.columns.position))

            const matchedColumn = findMatchingColumn(boardColumns, parsed.data.status)
            if (matchedColumn && matchedColumn.id !== existing.columnId) {
                updates.columnId = matchedColumn.id
                targetColumnName = matchedColumn.name

                const [{ value: activeCount }] = await db
                    .select({ value: count() })
                    .from(schema.cards)
                    .where(
                        and(
                            eq(schema.cards.columnId, matchedColumn.id),
                            eq(schema.cards.status, 'active')
                        )
                    )
                updates.position = nextPosition(activeCount)
            } else if (matchedColumn) {
                targetColumnName = matchedColumn.name
            }
        }

        const [updatedCard] = await db
            .update(schema.cards)
            .set(updates)
            .where(eq(schema.cards.id, id))
            .returning()

        if (!targetColumnName) {
            const [currentColumn] = await db
                .select({ name: schema.columns.name })
                .from(schema.columns)
                .where(eq(schema.columns.id, updatedCard.columnId))
                .limit(1)
            targetColumnName = currentColumn?.name ?? 'To do'
        }

        return NextResponse.json(formatTaskJson(updatedCard, targetColumnName))
    } catch (err) {
        console.error('Error updating task:', err)
        return NextResponse.json(
            { error: 'Failed to update task' },
            { status: 500 }
        )
    }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login first.' },
                { status: 401 }
            )
        }

        const { id } = await params

        const [existing] = await db
            .select()
            .from(schema.cards)
            .where(eq(schema.cards.id, id))
            .limit(1)

        if (!existing) {
            return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        try {
            await requireContentEditor(existing.boardId)
        } catch {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await db.delete(schema.cards).where(eq(schema.cards.id, id))

        return NextResponse.json({
            message: 'Task deleted successfully',
            id,
        })
    } catch (err) {
        console.error('Error deleting task:', err)
        return NextResponse.json(
            { error: 'Failed to delete task' },
            { status: 500 }
        )
    }
}
