import type { CardPriority } from '@/db/schema'

export const taskStatusValues = ['TODO', 'IN_PROGRESS', 'DONE'] as const
export type TaskStatus = (typeof taskStatusValues)[number]

export const taskPriorityValues = [
    'lowest',
    'low',
    'medium',
    'high',
    'highest',
    'urgent',
] as const
export type TaskPriority = (typeof taskPriorityValues)[number]

export function toDbPriority(priority?: string | null): CardPriority {
    if (!priority) return 'medium'
    const p = priority.toLowerCase()
    if (p === 'urgent' || p === 'highest') return 'highest'
    if (p === 'high') return 'high'
    if (p === 'low') return 'low'
    if (p === 'lowest') return 'lowest'
    return 'medium'
}

/**
 * Maps a Kanban column name to one of the 3 canonical task statuses:
 * TODO, IN_PROGRESS, or DONE.
 */
export function statusFromColumnName(name: string): TaskStatus {
    const col = name.trim().toLowerCase()
    if (col.includes('done') || col.includes('complete') || col.includes('finished')) {
        return 'DONE'
    }
    if (col.includes('progress') || col.includes('doing') || col.includes('review') || col.includes('active')) {
        return 'IN_PROGRESS'
    }
    return 'TODO'
}

/**
 * Finds the most suitable column for a requested status.
 * Expects columns to be sorted by position ascending.
 */
export function findMatchingColumn<
    T extends { id: string; name: string; position: number }
>(columns: T[], status: TaskStatus): T | null {
    if (columns.length === 0) return null

    // Exact or semantic match first
    for (const col of columns) {
        if (statusFromColumnName(col.name) === status) {
            return col
        }
    }

    // Fallbacks if board columns don't match typical names
    if (status === 'TODO') {
        return columns[0]
    }
    if (status === 'DONE') {
        return columns[columns.length - 1]
    }
    if (status === 'IN_PROGRESS') {
        if (columns.length > 2) return columns[1]
        return columns[0]
    }

    return columns[0]
}

export type TaskJson = {
    id: string
    boardId: string
    columnId: string
    title: string
    description: string
    status: TaskStatus
    statusName: string
    priority: string
    dueDate: string | null
    position: number
    createdAt: string
    updatedAt: string
}

export function formatTaskJson<
    T extends {
        id: string
        boardId: string
        columnId: string
        title: string
        description: string
        priority: string | null
        dueDate: Date | null
        position: number
        createdAt: Date
        updatedAt: Date
    }
>(card: T, columnName: string): TaskJson {
    return {
        id: card.id,
        boardId: card.boardId,
        columnId: card.columnId,
        title: card.title,
        description: card.description ?? '',
        status: statusFromColumnName(columnName),
        statusName: columnName,
        priority: card.priority ?? 'medium',
        dueDate: card.dueDate ? card.dueDate.toISOString() : null,
        position: card.position,
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString(),
    }
}
