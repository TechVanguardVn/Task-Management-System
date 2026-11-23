import type { TaskPriority, TaskStatus } from '../api/types';
import { PRIORITY_LABEL, STATUS_LABEL } from '../lib/format';

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={`pill pill-${priority.toLowerCase()}`}>{PRIORITY_LABEL[priority]}</span>;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      <i />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Tags({ tags, max = 3 }: { tags: string[]; max?: number }) {
  if (!tags.length) return null;
  const shown = tags.slice(0, max);
  return (
    <div className="tags">
      {shown.map((t) => (
        <span key={t} className="tag">
          # {t}
        </span>
      ))}
      {tags.length > max && <span className="tag tag-more">+{tags.length - max}</span>}
    </div>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="logo">
      <img src="/logo.svg" width={size} height={size} alt="" />
      <span>Taskflow</span>
    </span>
  );
}
