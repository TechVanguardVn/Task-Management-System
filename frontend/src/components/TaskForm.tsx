import { useState } from 'react';
import type { FormEvent } from 'react';
interface TaskFormProps {
    token: string;
    onCreated: (task: Task) => void;
}

interface Task {
    id: number;
    title: string;
    description?: string | null;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string | null;
}

function TaskForm({ token, onCreated }: TaskFormProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('MEDIUM');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    description: description || undefined,
                    priority,
                    dueDate: dueDate
                        ? new Date(`${dueDate}T23:59:59`).toISOString()
                        : undefined,
                }),
            });

            const data = await response.json();

            if (response.status === 401) {
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create task');
            }

            const task = data.data ?? data;

            onCreated(task);

            setTitle('');
            setDescription('');
            setPriority('MEDIUM');
            setDueDate('');
        } catch (error) {
            setError(
                error instanceof Error ? error.message : 'Failed to create task',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="task-form" onSubmit={handleSubmit}>
            <div className="task-form-row">
                <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Task title"
                    maxLength={200}
                    required
                />

                <select
                    value={priority}
                    onChange={(event) =>
                        setPriority(event.target.value as Task['priority'])
                    }
                >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                </select>

                <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                />

                <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : '+ Add Task'}
                </button>
            </div>

            <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Description (optional)"
                rows={2}
            />

            {error && <div className="task-form-error">{error}</div>}
        </form>
    );
}

export default TaskForm;