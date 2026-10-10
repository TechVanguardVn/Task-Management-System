import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { TaskListHeader } from './components/Header/TaskListHeader'
import type { TaskViewMode } from './components/Header/TaskListHeader'
import { TaskListToolbar } from './components/Toolbar/TaskListToolbar'
import { TaskListTable } from './components/Table/TaskListTable'
import { TaskListPagination } from './components/Pagination/TaskListPagination'
import { TaskListSkeleton } from './components/Table/TaskListSkeleton'
import { TaskFormModal } from '../components/TaskFormModal/TaskFormModal'
import { DispatchBoardDrawer } from './components/DispatchBoard/DispatchBoardDrawer'
import { useTaskList } from '../hooks/useTaskList'
import type { Task } from '../types/task.types'

import { useGetWorkspaceByIdQuery } from '@/services/queries/workspace.query'

export default function TaskListPage() {
  const { id: workspaceId } = useParams<{ id: string }>()
  const [viewMode, setViewMode] = useState<TaskViewMode>('my_tasks')
  const {
    tasks,
    isLoading,
    pagination,
    rawSearch,
    queryParams,
    setSearch,
    setFilter
  } = useTaskList(workspaceId || '', viewMode)

  const { data: workspaceData } = useGetWorkspaceByIdQuery(queryParams.workspaceId || '')
  const currentUserRole = workspaceData?.data?.role
  const isAdminOrManager = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | undefined>()

  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const openDispatch = searchParams.get('openDispatch') === 'true'

  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(openDispatch)

  useEffect(() => {
    if (openDispatch) {
      setIsDispatchModalOpen(true)
      searchParams.delete('openDispatch')
      navigate({ search: searchParams.toString() }, { replace: true })
    }
  }, [openDispatch, navigate, searchParams])

  const handleCreateTask = () => {
    setSelectedTask(undefined)
    setIsModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedTask(undefined), 300)
  }

  return (
    <div className="w-full relative">
      <div className="absolute -top-16 left-1/4 w-[32rem] h-[32rem] bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10 transform -translate-x-1/2"></div>
      <div className="absolute top-16 right-8 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute -top-8 right-1/3 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <TaskListHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onCreateTask={handleCreateTask}
        onDispatchMode={() => setIsDispatchModalOpen(true)}
        isAdminOrManager={isAdminOrManager}
        hasSelectedWorkspace={!!queryParams.workspaceId}
      />

      {isLoading && tasks.length === 0 ? (
        <TaskListSkeleton />
      ) : (
        <div className="flex flex-col w-full pb-10">
          <TaskListToolbar
            rawSearch={rawSearch}
            queryParams={queryParams}
            setSearch={setSearch}
            setFilter={setFilter}
          />
          <TaskListTable tasks={tasks} onEditTask={handleEditTask} isAdminOrManager={isAdminOrManager} />
          {pagination.totalPages > 1 && (
            <TaskListPagination
              pagination={pagination}
              onPageChange={(page) => setFilter('page', page)}
            />
          )}
        </div>
      )}

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={selectedTask}
      />

      <DispatchBoardDrawer
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        workspaceId={queryParams.workspaceId || ''}
      />
    </div>
  )
}
