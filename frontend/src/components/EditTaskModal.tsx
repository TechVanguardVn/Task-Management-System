import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Task } from './TaskCard';

interface EditTaskModalProps {
    task: Task;
    token: string;
    onUpdated: (task: Task) => void;
    onClose: () => void;
}

function EditTaskModal({
    task,
    token,
    onUpdated,
    onClose,
}: EditTaskModalProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description ?? '');
    const [status, setStatus] = useState<Task['status']>(task.status);
    const [priority, setPriority] = useState<Task['priority']>(task.priority);
    const [dueDate, setDueDate] = useState(
        task.dueDate ? task.dueDate.slice(0, 10) : '',
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');



    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        setError('');
        setLoading(true);

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
                        title,
                        description: description || undefined,
                        status,
                        priority,
                        dueDate: dueDate
                            ? new Date(`${dueDate}T23:59:59`).toISOString()
                            : undefined,
                    }),
                },
            );

            const data = await response.json();

            if (response.status === 401) {
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update task');
            }

            const updatedTask = data.data ?? data;

            onUpdated(updatedTask);
            onClose();
        } catch (error) {
            setError(
                error instanceof Error ? error.message : 'Failed to update task',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onMouseDown={onClose}>
            <div
                className="edit-task-modal"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="modal-header">
                    <h2>Edit Task</h2>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <label htmlFor="edit-title">Title</label>
                    <input
                        id="edit-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        maxLength={200}
                        required
                    />

                    <label htmlFor="edit-description">Description</label>
                    <textarea
                        id="edit-description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={4}
                    />

                    <div className="edit-task-grid">
                        <div>
                            <label htmlFor="edit-status">Status</label>
                            <select
                                id="edit-status"
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value as Task['status'])
                                }
                            >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="edit-priority">Priority</label>
                            <select
                                id="edit-priority"
                                value={priority}
                                onChange={(event) =>
                                    setPriority(event.target.value as Task['priority'])
                                }
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    <label htmlFor="edit-due-date">Due date</label>
                    <input
                        id="edit-due-date"
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                    />

                    {error && <div className="task-form-error">{error}</div>}

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditTaskModal;