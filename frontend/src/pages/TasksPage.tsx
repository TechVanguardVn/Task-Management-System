import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Columns3, List, Plus, X } from 'lucide-react';
import { useBoard, useTaskList } from '../api/hooks';
import { PRIORITIES, STATUSES, type ListParams } from '../api/types';
import { KanbanBoard } from '../components/KanbanBoard';
import { TaskModal, type ModalState } from '../components/TaskModal';
import { TaskTable } from '../components/TaskTable';
import { PRIORITY_LABEL, STATUS_LABEL } from '../lib/format';

const SORTS: { value: string; label: string }[] = [
  { value: 'createdAt:desc', label: 'Mới tạo nhất' },
  { value: 'dueDate:asc', label: 'Hạn gần nhất' },
  { value: 'priority:desc', label: 'Ưu tiên cao trước' },
  { value: 'title:asc', label: 'Tên A → Z' },
  { value: 'updatedAt:desc', label: 'Cập nhật gần đây' },
];

export function TasksPage() {
  const [params, setParams] = useSearchParams();
  const [modal, setModal] = useState<ModalState>(null);

  const view = params.get('view') === 'list' ? 'list' : 'board';
  const search = params.get('search') ?? '';
  const priority = params.get('priority') ?? '';
  const status = params.get('status') ?? '';
  const sort = params.get('sort') ?? 'createdAt:desc';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const limit = Number(params.get('limit')) || 10;

  const update = (patch: Record<string, string | null>) => {
    // Đọc URL hiện tại thay vì `params` của lần render trước: navigation của
    // React Router chạy trong startTransition nên `params` có thể chưa cập nhật.
    const next = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  const [sortBy, order] = sort.split(':') as [ListParams['sortBy'], ListParams['order']];
  const board = useBoard({ search: search || undefined, priority: priority || undefined });
  const list = useTaskList({ search, status, priority, page, limit, sortBy, order });

  const hasFilter = !!(search || priority || (view === 'list' && status));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Công việc của tôi</h1>
          <p className="muted">Tạo, sắp xếp và theo dõi tiến độ mọi việc cần làm.</p>
        </div>
        <button className="btn btn-dark" onClick={() => setModal({ mode: 'create' })}>
          <Plus size={16} /> Tạo công việc
        </button>
      </div>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={view === 'board'} className={view === 'board' ? 'active' : ''} onClick={() => update({ view: null })}>
          <Columns3 size={16} /> Bảng Kanban
        </button>
        <button role="tab" aria-selected={view === 'list'} className={view === 'list' ? 'active' : ''} onClick={() => update({ view: 'list' })}>
          <List size={16} /> Danh sách
        </button>
      </div>

      <div className="toolbar">
        <div className="chips" aria-label="Lọc theo mức ưu tiên">
          <button className={`chip ${!priority ? 'active' : ''}`} onClick={() => update({ priority: null })}>
            Tất cả
          </button>
          {PRIORITIES.map((p) => (
            <button
              key={p}
              className={`chip chip-${p.toLowerCase()} ${priority === p ? 'active' : ''}`}
              onClick={() => update({ priority: priority === p ? null : p })}
            >
              {PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>

        {view === 'list' && (
          <>
            <select value={status} onChange={(e) => update({ status: e.target.value })} aria-label="Lọc theo trạng thái">
              <option value="">Mọi trạng thái</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <select value={sort} onChange={(e) => update({ sort: e.target.value })} aria-label="Sắp xếp">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select value={limit} onChange={(e) => update({ limit: e.target.value })} aria-label="Số dòng mỗi trang">
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / trang
                </option>
              ))}
            </select>
          </>
        )}

        {search && (
          <span className="filter-pill">
            Tìm: “{search}”
            <button onClick={() => update({ search: null })} aria-label="Xoá từ khoá">
              <X size={13} />
            </button>
          </span>
        )}
        {hasFilter && (
          <button className="link-btn" onClick={() => update({ search: null, priority: null, status: null })}>
            Xoá bộ lọc
          </button>
        )}
      </div>

      {view === 'board' ? (
        board.isPending ? (
          <BoardSkeleton />
        ) : board.isError ? (
          <div className="alert">{board.error.message}</div>
        ) : (
          <KanbanBoard
            board={board.data}
            onOpen={(task) => setModal({ mode: 'edit', task })}
            onAdd={(s) => setModal({ mode: 'create', status: s })}
          />
        )
      ) : list.isPending ? (
        <div className="skeleton" style={{ height: 320 }} />
      ) : list.isError ? (
        <div className="alert">{list.error.message}</div>
      ) : (
        <TaskTable
          result={list.data}
          loading={list.isFetching}
          onOpen={(task) => setModal({ mode: 'edit', task })}
          onPage={(p) => update({ page: String(p) })}
        />
      )}

      <TaskModal state={modal} onClose={() => setModal(null)} />
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="board">
      {STATUSES.map((s) => (
        <div key={s} className="column">
          <div className="skeleton" style={{ height: 20, width: 120 }} />
          <div className="skeleton" style={{ height: 120 }} />
          <div className="skeleton" style={{ height: 120 }} />
        </div>
      ))}
    </div>
  );
}
