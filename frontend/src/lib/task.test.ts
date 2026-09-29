import { describe, expect, it } from 'vitest'
import { isOverdue } from './task'
import type { Task } from '../types'

const task: Task = { id: 1, title: 'Demo', status: 'TODO', priority: 'LOW', dueDate: '2026-09-28', createdAt: '', updatedAt: '' }

describe('isOverdue', () => {
  it('marks an unfinished task with a past due date as overdue', () => {
    expect(isOverdue(task, new Date('2026-09-29'))).toBe(true)
  })

  it('does not mark completed tasks as overdue', () => {
    expect(isOverdue({ ...task, status: 'DONE' }, new Date('2026-09-29'))).toBe(false)
  })
})
