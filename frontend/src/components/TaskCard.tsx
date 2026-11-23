import { CalendarDays, CalendarX2 } from 'lucide-react';
import type { Task } from '../api/types';
import { cardTint, formatDue, isOverdue } from '../lib/format';
import { PriorityBadge, Tags } from './Badges';

export function TaskCard({ task, overlay = false }: { task: Task; overlay?: boolean }) {
  const overdue = isOverdue(task);
  return (
    <article className={`card ${cardTint(task.id)} ${overlay ? 'card-overlay' : ''} ${task.status === 'DONE' ? 'card-done' : ''}`}>
      <div className="card-top">
        {task.dueDate ? (
          <span className={`due ${overdue ? 'due-late' : ''}`}>
            {overdue ? <CalendarX2 size={14} /> : <CalendarDays size={14} />}
            {formatDue(task.dueDate)}
          </span>
        ) : (
          <span className="due due-none">
            <CalendarDays size={14} /> Chưa đặt hạn
          </span>
        )}
        <PriorityBadge priority={task.priority} />
      </div>
      <h3 className="card-title">{task.title}</h3>
      {task.description && <p className="card-desc">{task.description}</p>}
      {(task.tags.length > 0 || overdue) && (
        <div className="card-bottom">
          {overdue ? <span className="late-chip">Quá hạn</span> : <span />}
          <Tags tags={task.tags} max={2} />
        </div>
      )}
    </article>
  );
}
