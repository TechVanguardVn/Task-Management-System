import { NextResponse } from 'next/server'
import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db, schema } from '@/db'
import { getCurrentUser } from '@/lib/auth/session'
import { requireContentEditor } from '@/lib/actions/helpers'
import { nextPosition } from '@/lib/domain/positions'
import {
    findMatchingColumn,
    formatTaskJson,
    taskPriorityValues,
    taskStatusValues,
    toDbPriority,
    type TaskPriority,
    type TaskStatus,
} from '@/lib/domain/tasks'

const createTaskSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    description: z.string().max(10000).optional().default(''),
    status: z.enum(taskStatusValues).optional().default('TODO'),
    priority: z.enum(taskPriorityValues).optional().default('medium'),
    dueDate: z.string().datetime({ offset: true }).nullable().optional(),
    boardId: z.string().uuid().optional(),
})

export async function GET(req: Request) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login first.' },
                { status: 401 }
            )
        }

        const url = new URL(req.url)
        const q = url.searchParams.get('q')?.trim()
        const status = url.searchParams.get('status')?.trim().toUpperCase() as
            | TaskStatus
            | undefined
        const priority = url.searchParams.get('priority')?.trim().toLowerCase() as
            | TaskPriority
            | undefined
        const boardId = url.searchParams.get('boardId')?.trim()

        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1)
        const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10) || 10))

        const conditions: (SQL | undefined)[] = [
            eq(schema.boardMemberships.userId, user.id),
            eq(schema.boardMemberships.status, 'active'),
            eq(schema.boards.status, 'active'),
            eq(schema.cards.status, 'active'),
        ]

        if (boardId) {
            conditions.push(eq(schema.cards.boardId, boardId))
        }

        if (priority && taskPriorityValues.includes(priority)) {
            conditions.push(eq(schema.cards.priority, toDbPriority(priority)))
        }

        if (q) {
            conditions.push(
                or(
                    ilike(schema.cards.title, `%${q}%`),
                    ilike(schema.cards.description, `%${q}%`)
                )
            )
        }

        const isDoneSql = sql`(lower(${schema.columns.name}) LIKE '%done%' OR lower(${schema.columns.name}) LIKE '%complete%' OR lower(${schema.columns.name}) LIKE '%finished%')`
        const isInProgressSql = sql`(lower(${schema.columns.name}) LIKE '%progress%' OR lower(${schema.columns.name}) LIKE '%doing%' OR lower(${schema.columns.name}) LIKE '%review%' OR lower(${schema.columns.name}) LIKE '%active%')`

        if (status === 'DONE') {
            conditions.push(isDoneSql)
        } else if (status === 'IN_PROGRESS') {
            conditions.push(isInProgressSql)
        } else if (status === 'TODO') {
            conditions.push(sql`NOT (${isDoneSql} OR ${isInProgressSql})`)
        }

        const filteredWhere = and(...conditions)

        const [countRow] = await db
            .select({ totalCount: count() })
            .from(schema.cards)
            .innerJoin(schema.columns, eq(schema.columns.id, schema.cards.columnId))
            .innerJoin(schema.boards, eq(schema.boards.id, schema.cards.boardId))
            .innerJoin(
                schema.boardMemberships,
                eq(schema.boardMemberships.boardId, schema.cards.boardId)
            )
            .where(filteredWhere)

        const totalItems = countRow?.totalCount ?? 0

        const rows = await db
            .select({
                card: schema.cards,
                columnName: schema.columns.name,
            })
            .from(schema.cards)
            .innerJoin(schema.columns, eq(schema.columns.id, schema.cards.columnId))
            .innerJoin(schema.boards, eq(schema.boards.id, schema.cards.boardId))
            .innerJoin(
                schema.boardMemberships,
                eq(schema.boardMemberships.boardId, schema.cards.boardId)
            )
            .where(filteredWhere)
            .orderBy(desc(schema.cards.createdAt))
            .limit(limit)
            .offset((page - 1) * limit)

        const data = rows.map((r) => formatTaskJson(r.card, r.columnName))

        return NextResponse.json({
            data,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit) || 1,
            },
        })
    } catch (err) {
        console.error('Error listing tasks:', err)
        return NextResponse.json(
            { error: 'Failed to retrieve tasks' },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login first.' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const parsed = createTaskSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? 'Invalid request data' },
                { status: 400 }
            )
        }

        let targetBoardId = parsed.data.boardId

        if (!targetBoardId) {
            const memberships = await db
                .select({ boardId: schema.boardMemberships.boardId })
                .from(schema.boardMemberships)
                .innerJoin(schema.boards, eq(schema.boards.id, schema.boardMemberships.boardId))
                .where(
                    and(
                        eq(schema.boardMemberships.userId, user.id),
                        eq(schema.boardMemberships.status, 'active'),
                        eq(schema.boards.status, 'active')
                    )
                )
                .orderBy(desc(schema.boards.updatedAt))
                .limit(1)

            if (memberships.length > 0) {
                targetBoardId = memberships[0].boardId
            } else {
                const [newBoard] = await db
                    .insert(schema.boards)
                    .values({ name: 'My Tasks', ownerId: user.id })
                    .returning()
                targetBoardId = newBoard.id

                await db.insert(schema.boardMemberships).values({
                    boardId: newBoard.id,
                    userId: user.id,
                    role: 'owner',
                })

                await db.insert(schema.columns).values([
                    { boardId: newBoard.id, name: 'To do', position: 0 },
                    { boardId: newBoard.id, name: 'In progress', position: 1 },
                    { boardId: newBoard.id, name: 'Done', position: 2 },
                ])
            }
        }

        await requireContentEditor(targetBoardId)

        const boardColumns = await db
            .select()
            .from(schema.columns)
            .where(
                and(
                    eq(schema.columns.boardId, targetBoardId),
                    eq(schema.columns.status, 'active')
                )
            )
            .orderBy(asc(schema.columns.position))

        const targetColumn = findMatchingColumn(boardColumns, parsed.data.status)
        if (!targetColumn) {
            return NextResponse.json(
                { error: 'No active column available for this board' },
                { status: 400 }
            )
        }

        const [{ value: activeCount }] = await db
            .select({ value: count() })
            .from(schema.cards)
            .where(
                and(
                    eq(schema.cards.columnId, targetColumn.id),
                    eq(schema.cards.status, 'active')
                )
            )

        const [card] = await db
            .insert(schema.cards)
            .values({
                boardId: targetBoardId,
                columnId: targetColumn.id,
                title: parsed.data.title,
                description: parsed.data.description ?? '',
                priority: toDbPriority(parsed.data.priority),
                dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
                position: nextPosition(activeCount),
            })
            .returning()

        return NextResponse.json(formatTaskJson(card, targetColumn.name), {
            status: 201,
        })
    } catch (err: unknown) {
        const error = err as { message?: string }
        if (error.message === 'FORBIDDEN' || error.message === 'NOT_FOUND') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        console.error('Error creating task:', err)
        return NextResponse.json(
            { error: 'Failed to create task' },
            { status: 500 }
        )
    }
}
