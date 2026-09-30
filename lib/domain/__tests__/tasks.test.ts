import { describe, expect, it } from 'vitest'
import {
    findMatchingColumn,
    formatTaskJson,
    statusFromColumnName,
} from '../tasks'

describe('statusFromColumnName', () => {
    it('maps to-do variations to TODO', () => {
        expect(statusFromColumnName('To Do')).toBe('TODO')
        expect(statusFromColumnName('Todo')).toBe('TODO')
        expect(statusFromColumnName('Backlog')).toBe('TODO')
        expect(statusFromColumnName('Planned')).toBe('TODO')
    })

    it('maps in-progress variations to IN_PROGRESS', () => {
        expect(statusFromColumnName('In Progress')).toBe('IN_PROGRESS')
        expect(statusFromColumnName('In progress')).toBe('IN_PROGRESS')
        expect(statusFromColumnName('Doing')).toBe('IN_PROGRESS')
        expect(statusFromColumnName('Code Review')).toBe('IN_PROGRESS')
    })

    it('maps done variations to DONE', () => {
        expect(statusFromColumnName('Done')).toBe('DONE')
        expect(statusFromColumnName('Completed')).toBe('DONE')
        expect(statusFromColumnName('Finished')).toBe('DONE')
    })
})

describe('findMatchingColumn', () => {
    const sampleColumns = [
        { id: 'col-1', name: 'To do', position: 0 },
        { id: 'col-2', name: 'In progress', position: 1 },
        { id: 'col-3', name: 'Done', position: 2 },
    ]

    it('finds column by status', () => {
        expect(findMatchingColumn(sampleColumns, 'TODO')?.id).toBe('col-1')
        expect(findMatchingColumn(sampleColumns, 'IN_PROGRESS')?.id).toBe('col-2')
        expect(findMatchingColumn(sampleColumns, 'DONE')?.id).toBe('col-3')
    })

    it('falls back gracefully when columns have arbitrary names', () => {
        const customColumns = [
            { id: 'c1', name: 'Column A', position: 0 },
            { id: 'c2', name: 'Column B', position: 1 },
            { id: 'c3', name: 'Column C', position: 2 },
        ]
        expect(findMatchingColumn(customColumns, 'TODO')?.id).toBe('c1')
        expect(findMatchingColumn(customColumns, 'IN_PROGRESS')?.id).toBe('c2')
        expect(findMatchingColumn(customColumns, 'DONE')?.id).toBe('c3')
    })

    it('handles empty column list', () => {
        expect(findMatchingColumn([], 'TODO')).toBeNull()
    })
})

describe('formatTaskJson', () => {
    it('formats card and column into standard task response', () => {
        const now = new Date('2026-09-30T10:00:00.000Z')
        const card = {
            id: 'task-1',
            boardId: 'board-1',
            columnId: 'col-2',
            title: 'Sample Task',
            description: 'Task description',
            priority: 'high',
            dueDate: new Date('2026-10-01T00:00:00.000Z'),
            position: 0,
            createdAt: now,
            updatedAt: now,
        }

        const formatted = formatTaskJson(card, 'In Progress')
        expect(formatted).toEqual({
            id: 'task-1',
            boardId: 'board-1',
            columnId: 'col-2',
            title: 'Sample Task',
            description: 'Task description',
            status: 'IN_PROGRESS',
            statusName: 'In Progress',
            priority: 'high',
            dueDate: '2026-10-01T00:00:00.000Z',
            position: 0,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        })
    })
})
