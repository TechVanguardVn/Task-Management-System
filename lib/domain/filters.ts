export type FilterableCard = {
    columnId: string
    title: string
    description: string
    dueDate: Date | null
    priority: string | null
}

export type BoardFilters = {
    column?: string
    priority?: string
    overdue?: boolean
    q?: string
}

export function isOverdue(
    dueDate: Date | null,
    now: Date = new Date()
): boolean {
    return !!dueDate && dueDate.getTime() < now.getTime()
}

export function matchesFilters<T extends FilterableCard>(
    card: T,
    filters: BoardFilters,
    now: Date = new Date()
): boolean {
    if (filters.column && card.columnId !== filters.column) return false
    if (filters.priority && card.priority !== filters.priority) return false
    if (filters.overdue && !isOverdue(card.dueDate, now)) return false
    if (filters.q) {
        const q = filters.q.trim().toLowerCase()
        if (
            q &&
            !card.title.toLowerCase().includes(q) &&
            !card.description.toLowerCase().includes(q)
        )
            return false
    }
    return true
}
