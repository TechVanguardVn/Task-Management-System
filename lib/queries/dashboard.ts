import { db, schema } from '@/db'
import { and, eq } from 'drizzle-orm'
import 'server-only'

export type UpcomingTask = {
    id: string
    title: string
    boardId: string
    boardName: string
    columnName: string
    priority: string | null
    dueDate: Date
}

export type UserDashboardData = {
    totalTasks: number
    toDoCount: number
    inProgressCount: number
    doneCount: number
    upcomingTasks: UpcomingTask[]
}

export async function getUserDashboardData(
    userId: string
): Promise<UserDashboardData> {
    const cards = await db
        .select({
            id: schema.cards.id,
            title: schema.cards.title,
            boardId: schema.cards.boardId,
            priority: schema.cards.priority,
            dueDate: schema.cards.dueDate,
            boardName: schema.boards.name,
            columnName: schema.columns.name,
        })
        .from(schema.cards)
        .innerJoin(schema.boards, eq(schema.boards.id, schema.cards.boardId))
        .innerJoin(schema.columns, eq(schema.columns.id, schema.cards.columnId))
        .innerJoin(
            schema.boardMemberships,
            eq(schema.boardMemberships.boardId, schema.cards.boardId)
        )
        .where(
            and(
                eq(schema.boardMemberships.userId, userId),
                eq(schema.boardMemberships.status, 'active'),
                eq(schema.boards.status, 'active'),
                eq(schema.cards.status, 'active')
            )
        )

    let toDoCount = 0
    let inProgressCount = 0
    let doneCount = 0

    for (const card of cards) {
        const col = card.columnName.trim().toLowerCase()
        if (col.includes('done') || col.includes('complete')) {
            doneCount++
        } else if (col.includes('progress') || col.includes('doing')) {
            inProgressCount++
        } else {
            toDoCount++
        }
    }

    const upcomingTasks = cards
        .filter((c): c is typeof c & { dueDate: Date } => c.dueDate !== null)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .slice(0, 6)
        .map((c) => ({
            id: c.id,
            title: c.title,
            boardId: c.boardId,
            boardName: c.boardName,
            columnName: c.columnName,
            priority: c.priority,
            dueDate: c.dueDate,
        }))

    return {
        totalTasks: cards.length,
        toDoCount,
        inProgressCount,
        doneCount,
        upcomingTasks,
    }
}
