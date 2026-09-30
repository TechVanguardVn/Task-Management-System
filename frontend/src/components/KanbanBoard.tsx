import { useEffect, useState } from 'react';
import TaskCard, { type Task } from './TaskCard';
import TaskForm from './TaskForm';
import EditTaskModal from './EditTaskModal';

interface KanbanBoardProps {
    token: string;
    onLogout: () => void;
}

type TaskStatus = Task['status'];

const columns: { status: TaskStatus; title: string }[] = [
    { status: 'TODO', title: 'To Do' },
    { status: 'IN_PROGRESS', title: 'In Progress' },
    { status: 'DONE', title: 'Done' },
];

function KanbanBoard({ token, onLogout }: KanbanBoardProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [dashboard, setDashboard] = useState<{
        total: number;
        todo: number;
        inProgress: number;
        done: number;
        upcomingTasks: Task[];
    } | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
    const [priorityFilter, setPriorityFilter] = useState<
        Task['priority'] | ''
    >('');
    const loadDashboard = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/tasks/dashboard`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            const data = await response.json();

            if (response.status === 401) {
                onLogout();
                return;
            }

            if (!response.ok) {
                throw new Error(
                    data.message || 'Failed to load dashboard',
                );
            }

            setDashboard(data.data ?? data);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to load dashboard',
            );
        }
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [tasksResponse, dashboardResponse] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/tasks`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                    fetch(`${import.meta.env.VITE_API_URL}/tasks/dashboard`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }),
                ]);

                const tasksData = await tasksResponse.json();
                const dashboardData = await dashboardResponse.json();

                if (
                    tasksResponse.status === 401 ||
                    dashboardResponse.status === 401
                ) {
                    onLogout();
                    return;
                }

                if (!tasksResponse.ok) {
                    throw new Error(
                        tasksData.message || 'Failed to load tasks',
                    );
                }

                if (!dashboardResponse.ok) {
                    throw new Error(
                        dashboardData.message || 'Failed to load dashboard',
                    );
                }

                setTasks(tasksData.data ?? tasksData);
                setDashboard(dashboardData.data ?? dashboardData);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : 'Failed to load data',
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [token, onLogout]);

    const handleDelete = async (id: number) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                onLogout();
                return;
            }

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete task');
            }

            setTasks((currentTasks) =>
                currentTasks.filter((task) => task.id !== id),
            );
            await loadDashboard();
        } catch (error) {
            setError(
                error instanceof Error ? error.message : 'Failed to delete task',
            );
        }
    };

    const handleDragStart = (task: Task) => {
        // Tạm thời lưu task đang kéo vào window.
        window.sessionStorage.setItem(
            'draggedTask',
            JSON.stringify(task),
        );
    };

    const handleDrop = async (status: TaskStatus) => {
        const storedTask = window.sessionStorage.getItem('draggedTask');

        if (!storedTask) {
            return;
        }

        const task: Task = JSON.parse(storedTask);

        window.sessionStorage.removeItem('draggedTask');

        if (task.status === status) {
            return;
        }

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/tasks/${task.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        status,
                    }),
                },
            );

            if (response.status === 401) {
                onLogout();
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update task');
            }

            const updatedTask = data.data ?? data;

            setTasks((currentTasks) =>
                currentTasks.map((currentTask) =>
                    currentTask.id === task.id ? updatedTask : currentTask,
                ),
            );

            await loadDashboard();
        } catch (error) {
            setError(
                error instanceof Error ? error.message : 'Failed to update task',
            );
        }
    };

    if (loading) {
        return <p>Loading tasks...</p>;
    }

    if (error) {
        return (
            <div>
                <p>{error}</p>
                <button onClick={onLogout}>Logout</button>
            </div>
        );
    }

    return (
        <div className="kanban-page">
            <header className="kanban-header">
                <div>
                    <h1>Task Management</h1>
                    <p>Manage your tasks with Kanban</p>
                </div>

                <button onClick={onLogout}>Logout</button>
            </header>

            <TaskForm
                token={token}
                onCreated={async (newTask) => {
                    setTasks((currentTasks) => [newTask, ...currentTasks]);
                    await loadDashboard();
                }}
            />
            {dashboard && (
                <section className="dashboard">
                    <div className="dashboard-card">
                        <span>Total</span>
                        <strong>{dashboard.total}</strong>
                    </div>

                    <div className="dashboard-card">
                        <span>To Do</span>
                        <strong>{dashboard.todo}</strong>
                    </div>

                    <div className="dashboard-card">
                        <span>In Progress</span>
                        <strong>{dashboard.inProgress}</strong>
                    </div>

                    <div className="dashboard-card">
                        <span>Done</span>
                        <strong>{dashboard.done}</strong>
                    </div>
                </section>
            )}
            {dashboard && dashboard.upcomingTasks.length > 0 && (
                <section className="upcoming-tasks">
                    <div className="upcoming-tasks-header">
                        <h2>Upcoming Tasks</h2>
                        <span>Next due tasks</span>
                    </div>

                    <div className="upcoming-tasks-list">
                        {dashboard.upcomingTasks.map((task) => (
                            <div key={task.id} className="upcoming-task">
                                <div>
                                    <strong>{task.title}</strong>

                                    {task.description && (
                                        <p>{task.description}</p>
                                    )}
                                </div>

                                <div className="upcoming-task-meta">
                                    <span
                                        className={`priority priority-${task.priority.toLowerCase()}`}
                                    >
                                        {task.priority}
                                    </span>

                                    {task.dueDate && (
                                        <span>
                                            Due:{' '}
                                            {new Date(
                                                task.dueDate,
                                            ).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
            <div className="task-filters">
                <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search tasks..."
                />

                <select
                    value={statusFilter}
                    onChange={(event) =>
                        setStatusFilter(event.target.value as TaskStatus | '')
                    }
                >
                    <option value="">All statuses</option>
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                </select>

                <select
                    value={priorityFilter}
                    onChange={(event) =>
                        setPriorityFilter(
                            event.target.value as Task['priority'] | '',
                        )
                    }
                >
                    <option value="">All priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                </select>
            </div>
            <main className="kanban-board">
                {columns.map((column) => {
                    const columnTasks = tasks.filter((task) => {
                        const matchesStatus = task.status === column.status;

                        const matchesSearch = task.title
                            .toLowerCase()
                            .includes(search.toLowerCase());

                        const matchesPriority =
                            !priorityFilter || task.priority === priorityFilter;

                        const matchesStatusFilter =
                            !statusFilter || task.status === statusFilter;

                        return (
                            matchesStatus &&
                            matchesSearch &&
                            matchesPriority &&
                            matchesStatusFilter
                        );
                    });

                    return (
                        <section
                            key={column.status}
                            className="kanban-column"
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => handleDrop(column.status)}
                        >
                            <div className="kanban-column-header">
                                <h2>{column.title}</h2>
                                <span>{columnTasks.length}</span>
                            </div>

                            <div className="kanban-column-content">
                                {columnTasks.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onDelete={handleDelete}
                                        onEdit={(selectedTask) => { setEditingTask(selectedTask) }}
                                        onDragStart={handleDragStart}
                                    />
                                ))}

                                {columnTasks.length === 0 && (
                                    <p className="empty-column">No tasks</p>
                                )}
                            </div>
                        </section>
                    );
                })}
            </main>
            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    token={token}
                    onUpdated={async (updatedTask) => {
                        setTasks((currentTasks) =>
                            currentTasks.map((currentTask) =>
                                currentTask.id === updatedTask.id
                                    ? updatedTask
                                    : currentTask,
                            ),
                        );
                        await loadDashboard();
                    }}
                    onClose={() => setEditingTask(null)}
                />
            )}
        </div>
    );
}

export default KanbanBoard;