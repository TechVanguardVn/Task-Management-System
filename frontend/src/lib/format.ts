import type { Task, TaskPriority, TaskStatus } from '../api/types';

export const STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang làm',
  DONE: 'Hoàn thành',
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
};

const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const pad = (n: number) => String(n).padStart(2, '0');

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Hôm nay, 14/05" · "Ngày mai, 15/05" · "T2, 16/05" · "16/05/2027" */
export function formatDue(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.round((startOfDay(d) - startOfDay(now)) / 86_400_000);
  const dm = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  if (diff === 0) return `Hôm nay, ${dm}`;
  if (diff === 1) return `Ngày mai, ${dm}`;
  if (diff === -1) return `Hôm qua, ${dm}`;
  if (d.getFullYear() !== now.getFullYear()) return `${dm}/${d.getFullYear()}`;
  return `${WEEKDAY[d.getDay()]}, ${dm}`;
}

/** Số ngày còn lại (âm = quá hạn) dưới dạng chữ */
export function relativeDue(iso: string): string {
  const diff = Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / 86_400_000);
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Ngày mai';
  if (diff > 1) return `Còn ${diff} ngày`;
  if (diff === -1) return 'Trễ 1 ngày';
  return `Trễ ${-diff} ngày`;
}

export function isOverdue(task: Pick<Task, 'dueDate' | 'status'>) {
  return !!task.dueDate && task.status !== 'DONE' && new Date(task.dueDate).getTime() < Date.now();
}

/** ISO -> giá trị cho <input type="date"> theo giờ địa phương */
export function toDateInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "2026-11-30" -> ISO lúc 23:59 giờ địa phương (hết ngày hôm đó) */
export function fromDateInput(value: string): string | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 0).toISOString();
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Chọn 1 trong 3 dải màu nền cho thẻ, cố định theo id */
export function cardTint(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ['tint-violet', 'tint-sky', 'tint-peach'][h % 3];
}
