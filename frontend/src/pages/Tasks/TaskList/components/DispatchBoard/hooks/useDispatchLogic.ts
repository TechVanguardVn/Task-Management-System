import { useState, useEffect } from 'react'
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import type { Task } from '@/pages/Tasks/types/task.types'
import { useGetTasksQuery, useUpdateTaskMutation } from '@/services/queries/task.query'
import { useGetWorkspaceMembersQuery } from '@/services/queries/workspace.query'
import { message } from 'antd'

export const useDispatchLogic = (workspaceId: string) => {
  const { data: tasksData } = useGetTasksQuery({ workspaceId, limit: 100 })
  const { data: membersData } = useGetWorkspaceMembersQuery(workspaceId)
  const { mutateAsync: updateTask } = useUpdateTaskMutation()

  const allTasks = tasksData?.data?.items || []
  const members = membersData?.data || []

  const mappedMembers = members.map((m: any) => ({
    id: m.id,
    name: m.fullName || m.email,
    email: m.email,
    avatar: m.avatar,
    role: m.role,
    activeTasksCount: 0
  }))

  const getAssigneeId = (t: Task) => typeof t.assigneeId === 'object' ? t.assigneeId?._id : t.assigneeId

  const initialUnassigned = allTasks.filter((t: Task) => !getAssigneeId(t) && t.status !== 'DONE')
  const initialMemberTasks = mappedMembers.reduce((acc: Record<string, Task[]>, member: any) => {
    acc[member.id] = allTasks.filter((t: Task) => getAssigneeId(t) === member.id && t.status !== 'DONE')
    return acc
  }, {} as Record<string, Task[]>)

  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>(initialUnassigned)
  const [memberTasks, setMemberTasks] = useState<Record<string, Task[]>>(initialMemberTasks)

  // Update local state when remote data changes (initial load)
  useEffect(() => {
    setUnassignedTasks(allTasks.filter((t: Task) => !getAssigneeId(t) && t.status !== 'DONE'))
    const newMemberTasks = mappedMembers.reduce((acc: Record<string, Task[]>, member: any) => {
      acc[member.id] = allTasks.filter((t: Task) => getAssigneeId(t) === member.id && t.status !== 'DONE')
      return acc
    }, {} as Record<string, Task[]>)
    setMemberTasks(newMemberTasks)
  }, [tasksData, membersData])

  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = unassignedTasks.find(t => t._id === active.id) ||
      Object.values(memberTasks).flat().find(t => t._id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string
    const overId = over.id as string // This is the member ID or 'unassigned'

    // Find where the task currently is
    const isFromUnassigned = unassignedTasks.some(t => t._id === taskId)
    const task = isFromUnassigned
      ? unassignedTasks.find(t => t._id === taskId)
      : Object.values(memberTasks).flat().find(t => t._id === taskId)

    if (!task) return

    // If dropping back to unassigned
    if (overId === 'unassigned') {
      if (isFromUnassigned) return // No change

      // Remove from member
      const newMemberTasks = { ...memberTasks }
      for (const mId in newMemberTasks) {
        newMemberTasks[mId] = newMemberTasks[mId].filter(t => t._id !== taskId)
      }
      setMemberTasks(newMemberTasks)

      // Add to unassigned
      setUnassignedTasks(prev => [...prev, { ...task, assigneeId: undefined }])

      updateTask({ id: taskId, body: { assigneeId: null } as any }).catch(() => {
        message.error('Failed to update task assignment')
      })
      return
    }

    // Dropping to a member
    const memberId = overId

    // Remove from source
    if (isFromUnassigned) {
      setUnassignedTasks(prev => prev.filter(t => t._id !== taskId))
    } else {
      const newMemberTasks = { ...memberTasks }
      for (const mId in newMemberTasks) {
        newMemberTasks[mId] = newMemberTasks[mId].filter(t => t._id !== taskId)
      }
      setMemberTasks(newMemberTasks)
    }

    // Add to target member
    setMemberTasks(prev => ({
      ...prev,
      [memberId]: [...(prev[memberId] || []), { ...task, assigneeId: memberId }]
    }))

    updateTask({ id: taskId, body: { assigneeId: memberId === 'unassigned' ? null : memberId } as any }).catch(() => {
      message.error('Failed to update task assignment')
    })
  }

  return {
    unassignedTasks,
    memberTasks,
    members: mappedMembers,
    activeTask,
    handleDragStart,
    handleDragEnd
  }
}
