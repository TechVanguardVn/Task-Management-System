interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string | null;
}

interface TaskCardProps {
  task: Task;
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
  onDragStart: (task: Task) => void;
}

function TaskCard({
  task,
  onDelete,
  onEdit,
  onDragStart,
}: TaskCardProps) {
  return (
    <div
      className="task-card"
      draggable
      onDragStart={() => onDragStart(task)}
    >
      <div className="task-card-header">
        <h3>{task.title}</h3>

        <div className="task-card-actions">
          <button
            className="edit-button"
            onClick={() => onEdit(task)}
            type="button"
          >
            ✎
          </button>

          <button
            className="delete-button"
            onClick={() => onDelete(task.id)}
            type="button"
          >
            ×
          </button>
        </div>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-card-footer">
        <span className={`priority priority-${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>

        {task.dueDate && (
          <span className="task-due-date">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

export type { Task };
export default TaskCard;