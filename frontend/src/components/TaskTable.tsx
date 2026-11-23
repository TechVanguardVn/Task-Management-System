import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import type { Paginated, Task } from '../api/types';
import { formatDue, isOverdue } from '../lib/format';
import { PriorityBadge, StatusBadge, Tags } from './Badges';

interface Props {
  result: Paginated<Task>;
  onOpen: (t: Task) => void;
  onPage: (page: number) => void;
  loading?: boolean;
}

function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('…');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}

export function TaskTable({ result, onOpen, onPage, loading }: Props) {
  const { data, meta } = result;
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className={`table-wrap ${loading ? 'is-loading' : ''}`}>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Công việc</th>
              <th>Trạng thái</th>
              <th>Ưu tiên</th>
              <th>Hạn hoàn thành</th>
              <th aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id} onClick={() => onOpen(t)}>
                <td>
                  <div className={`cell-title ${t.status === 'DONE' ? 'is-done' : ''}`}>{t.title}</div>
                  <Tags tags={t.tags} max={3} />
                </td>
                <td>
                  <StatusBadge status={t.status} />
                </td>
                <td>
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className={isOverdue(t) ? 'late' : 'muted'}>{t.dueDate ? formatDue(t.dueDate) : '—'}</td>
                <td className="cell-action">
                  <button
                    className="icon-btn"
                    aria-label={`Sửa ${t.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(t);
                    }}
                  >
                    <Pencil size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <div className="empty">Không có công việc nào khớp bộ lọc.</div>}
      </div>

      <div className="pagination">
        <span className="muted">
          Hiển thị {from}–{to} / {meta.total}
        </span>
        <div className="pages">
          <button className="icon-btn" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} aria-label="Trang trước">
            <ChevronLeft size={16} />
          </button>
          {pageList(meta.page, meta.totalPages).map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="ellipsis">
                …
              </span>
            ) : (
              <button key={p} className={`pg ${p === meta.page ? 'active' : ''}`} onClick={() => onPage(p)}>
                {p}
              </button>
            ),
          )}
          <button
            className="icon-btn"
            disabled={meta.page >= meta.totalPages}
            onClick={() => onPage(meta.page + 1)}
            aria-label="Trang sau"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
