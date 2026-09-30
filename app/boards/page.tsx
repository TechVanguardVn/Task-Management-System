import { StaggerIn } from '@/app/_components/stagger-in'
import { getCurrentUser } from '@/lib/auth/session'
import { formatTaskflowDate } from '@/lib/format'
import { listBoardsForUser } from '@/lib/queries/boards'
import { getUserDashboardData } from '@/lib/queries/dashboard'
import {
    Calendar,
    CheckCircle2,
    Clock,
    FolderKanban,
    ListTodo,
    Loader2,
    SquareCheck,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { NewBoardForm } from './new-board-form'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function BoardsDashboard() {
    const user = await getCurrentUser()
    if (!user) return null

    const [{ active }, dashboard] = await Promise.all([
        listBoardsForUser(user.id),
        getUserDashboardData(user.id),
    ])

    return (
        <div className="flex flex-col gap-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">
                        Dashboard
                    </h1>
                    <p className="text-xs text-stone-400 mt-1 font-normal">
                        Overview of your tasks, progress, and upcoming
                        deadlines.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <NewBoardForm />
                </div>
            </div>

            {/* KPI Cards: Total, To Do, In Progress, Done */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#FAF9F6] border border-stone-200/80 rounded-[22px] p-4.5 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-stone-500">
                            Total Tasks
                        </span>
                        <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                            <ListTodo size={16} strokeWidth={2.2} />
                        </span>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-stone-900 tracking-tight">
                            {dashboard.totalTasks}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                            Across all projects
                        </p>
                    </div>
                </div>

                <div className="bg-[#FAF9F6] border border-stone-200/80 rounded-[22px] p-4.5 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-stone-500">
                            To Do
                        </span>
                        <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                            <Clock size={16} strokeWidth={2.2} />
                        </span>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-stone-900 tracking-tight">
                            {dashboard.toDoCount}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                            Not started yet
                        </p>
                    </div>
                </div>

                <div className="bg-[#FAF9F6] border border-stone-200/80 rounded-[22px] p-4.5 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-stone-500">
                            In Progress
                        </span>
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Loader2 size={16} strokeWidth={2.2} />
                        </span>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-stone-900 tracking-tight">
                            {dashboard.inProgressCount}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                            Currently working on
                        </p>
                    </div>
                </div>

                <div className="bg-[#FAF9F6] border border-stone-200/80 rounded-[22px] p-4.5 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-stone-500">
                            Completed
                        </span>
                        <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 size={16} strokeWidth={2.2} />
                        </span>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-stone-900 tracking-tight">
                            {dashboard.doneCount}
                        </p>
                        <p className="text-[11px] text-stone-400 mt-0.5">
                            Tasks finished
                        </p>
                    </div>
                </div>
            </div>

            {/* Upcoming Deadlines (Công việc sắp đến hạn) */}
            <section
                aria-labelledby="upcoming-tasks-heading"
                className="flex flex-col gap-3"
            >
                <div className="flex items-center justify-between">
                    <h2
                        id="upcoming-tasks-heading"
                        className="text-sm font-bold text-stone-900 flex items-center gap-2"
                    >
                        <Calendar size={16} className="text-orange-500" />
                        <span>Upcoming Tasks</span>
                    </h2>
                    <span className="text-xs text-stone-400 font-medium">
                        {dashboard.upcomingTasks.length} task
                        {dashboard.upcomingTasks.length === 1 ? '' : 's'}
                    </span>
                </div>

                {dashboard.upcomingTasks.length === 0 ? (
                    <div className="bg-[#FAF9F6] rounded-[22px] border border-stone-200/70 text-center py-8 text-xs text-stone-400">
                        No upcoming due tasks.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {dashboard.upcomingTasks.map((task) => (
                            <Link
                                key={task.id}
                                href={`/boards/${task.boardId}/cards/${task.id}`}
                                className="group bg-[#FAF9F6] hover:bg-white border border-stone-200/80 hover:border-orange-200 rounded-[20px] p-4 flex flex-col justify-between transition-all duration-150 shadow-2xs hover:shadow-sm"
                            >
                                <div>
                                    <div className="flex items-center justify-between text-[11px] mb-2">
                                        <span className="inline-flex items-center gap-1 text-stone-400 font-medium">
                                            <Calendar size={12} />
                                            <span>
                                                {formatTaskflowDate(
                                                    task.dueDate
                                                )}
                                            </span>
                                        </span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF5ED] text-[#FF6B00] border border-[#FFE7D6]">
                                            {task.priority
                                                ? task.priority
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                  task.priority.slice(1)
                                                : 'Medium'}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-stone-800 group-hover:text-orange-600 transition-colors line-clamp-2">
                                        {task.title}
                                    </h3>
                                </div>
                                <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-400">
                                    <span>{task.boardName}</span>
                                    <span className="font-medium text-stone-500">
                                        {task.columnName}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Active Boards / Projects */}
            <section
                aria-labelledby="active-boards-heading"
                className="flex flex-col gap-3"
            >
                <div className="flex items-center justify-between">
                    <h2
                        id="active-boards-heading"
                        className="text-sm font-bold text-stone-900 flex items-center gap-2"
                    >
                        <FolderKanban size={16} className="text-orange-500" />
                        <span>Active Projects ({active.length})</span>
                    </h2>
                </div>

                {active.length === 0 ? (
                    <div className="bg-[#FAF9F6] rounded-[22px] border border-stone-200/70 text-center py-10 text-xs text-stone-400">
                        No projects yet. Click &ldquo;New board&rdquo; to create
                        your first project.
                    </div>
                ) : (
                    <StaggerIn className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {active.map(({ board, cardCount }) => (
                            <Link
                                key={board.id}
                                href={`/boards/${board.id}`}
                                className="group bg-[#FAF9F6] hover:bg-white border border-stone-200/80 hover:border-orange-200 rounded-[20px] p-4.5 flex flex-col justify-between transition-all duration-150 shadow-2xs hover:shadow-sm"
                            >
                                <div>
                                    <h3 className="font-bold text-sm text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                                        {board.name}
                                    </h3>
                                    <p className="text-xs text-stone-400 mt-1 line-clamp-1">
                                        Active board with Kanban workflows
                                    </p>
                                </div>
                                <div className="mt-4 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-400">
                                    <span className="flex items-center gap-1.5 font-medium text-stone-500">
                                        <SquareCheck
                                            size={14}
                                            className="text-orange-500"
                                        />
                                        <span>
                                            {cardCount} task
                                            {cardCount === 1 ? '' : 's'}
                                        </span>
                                    </span>
                                    <span className="text-[11px] text-stone-400 group-hover:text-stone-700 transition-colors">
                                        Open &rarr;
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </StaggerIn>
                )}
            </section>
        </div>
    )
}

export const dynamic = 'force-dynamic'
