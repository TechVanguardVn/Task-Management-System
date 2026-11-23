import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlarmClock, CircleCheckBig, CircleDashed, Layers, LoaderCircle, Plus } from 'lucide-react';
import { useDashboard } from '../api/hooks';
import type { DashboardData, Task } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { TaskModal, type ModalState } from '../components/TaskModal';
import { PRIORITY_LABEL, formatDue, relativeDue } from '../lib/format';

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export function DashboardPage() {
  const { user } = useAuth();
  const [days, setDays] = useState(7);
  const { data, isPending, isError, error } = useDashboard(days);
  const [modal, setModal] = useState<ModalState>(null);
  const open = (task: Task) => setModal({ mode: 'edit', task });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>
            {greeting()}, {user?.name}
          </h1>
          <p className="muted">Tổng quan tiến độ công việc của bạn hôm nay.</p>
        </div>
        <button className="btn btn-dark" onClick={() => setModal({ mode: 'create' })}>
          <Plus size={16} /> Tạo công việc
        </button>
      </div>

      {isPending ? (
        <div className="stats">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 112 }} />
          ))}
        </div>
      ) : isError ? (
        <div className="alert">{error.message}</div>
      ) : (
        <>
          <div className="stats">
            <Stat icon={<Layers size={18} />} label="Tổng số công việc" value={data.stats.total} tone="neutral" to="/tasks?view=list" />
            <Stat icon={<CircleDashed size={18} />} label="Chưa bắt đầu" value={data.stats.todo} tone="todo" to="/tasks?view=list&status=TODO" />
            <Stat icon={<LoaderCircle size={18} />} label="Đang thực hiện" value={data.stats.inProgress} tone="progress" to="/tasks?view=list&status=IN_PROGRESS" />
            <Stat icon={<CircleCheckBig size={18} />} label="Đã hoàn thành" value={data.stats.done} tone="done" to="/tasks?view=list&status=DONE" />
          </div>

          <div className="dash-grid">
            <section className="box">
              <header className="box-head">
                <div>
                  <h2>Sắp đến hạn</h2>
                  <p className="muted">Chưa hoàn thành, hạn trong {days} ngày tới</p>
                </div>
                <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Khoảng thời gian">
                  <option value={3}>3 ngày</option>
                  <option value={7}>7 ngày</option>
                  <option value={14}>14 ngày</option>
                  <option value={30}>30 ngày</option>
                </select>
              </header>
              {data.upcoming.length === 0 ? (
                <div className="empty">Không có công việc nào sắp đến hạn. 🎉</div>
              ) : (
                <ul className="due-list">
                  {data.upcoming.map((t) => (
                    <DueRow key={t.id} task={t} onOpen={open} />
                  ))}
                </ul>
              )}

              {data.overdue.length > 0 && (
                <>
                  <header className="box-head box-head-sub">
                    <h2 className="late">
                      <AlarmClock size={17} /> Quá hạn ({data.stats.overdue})
                    </h2>
                  </header>
                  <ul className="due-list">
                    {data.overdue.map((t) => (
                      <DueRow key={t.id} task={t} onOpen={open} late />
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="box">
              <header className="box-head">
                <h2>Tiến độ</h2>
              </header>
              <Donut stats={data.stats} />
              <div className="legend">
                <span><i className="dot dot-done" /> Hoàn thành <b>{data.stats.done}</b></span>
                <span><i className="dot dot-in_progress" /> Đang làm <b>{data.stats.inProgress}</b></span>
                <span><i className="dot dot-todo" /> Cần làm <b>{data.stats.todo}</b></span>
              </div>

              <header className="box-head box-head-sub">
                <h2>Việc còn mở theo ưu tiên</h2>
              </header>
              <PriorityBars data={data.openByPriority} />
              <Link to="/tasks" className="link-btn block">
                Mở bảng Kanban →
              </Link>
            </section>
          </div>
        </>
      )}

      <TaskModal state={modal} onClose={() => setModal(null)} />
    </div>
  );
}

function Stat({ icon, label, value, tone, to }: { icon: React.ReactNode; label: string; value: number; tone: string; to: string }) {
  return (
    <Link to={to} className={`stat stat-${tone}`}>
      <span className="stat-icon">{icon}</span>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
    </Link>
  );
}

function DueRow({ task, onOpen, late = false }: { task: Task; onOpen: (t: Task) => void; late?: boolean }) {
  return (
    <li>
      <button className="due-row" onClick={() => onOpen(task)}>
        <span className="due-date">
          <strong className={late ? 'late' : ''}>{relativeDue(task.dueDate!)}</strong>
          <small>{formatDue(task.dueDate!)}</small>
        </span>
        <span className="due-title">{task.title}</span>
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
      </button>
    </li>
  );
}

function Donut({ stats }: { stats: DashboardData['stats'] }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const total = stats.total || 1;
  const segments = [
    { value: stats.done, cls: 'seg-done' },
    { value: stats.inProgress, cls: 'seg-progress' },
    { value: stats.todo, cls: 'seg-todo' },
  ];
  let offset = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 140 140" role="img" aria-label={`Hoàn thành ${stats.completionRate}%`}>
        <circle cx="70" cy="70" r={r} className="donut-track" />
        {stats.total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={s.cls}
                cx="70"
                cy="70"
                r={r}
                className={s.cls}
                strokeDasharray={`${Math.max(len - 3, 0)} ${c}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <div className="donut-center">
        <strong>{stats.completionRate}%</strong>
        <span>hoàn thành</span>
      </div>
    </div>
  );
}

function PriorityBars({ data }: { data: DashboardData['openByPriority'] }) {
  const max = Math.max(1, data.HIGH, data.MEDIUM, data.LOW);
  return (
    <div className="bars">
      {(['HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
        <div key={p} className="bar-row">
          <span>{PRIORITY_LABEL[p]}</span>
          <div className="bar">
            <i className={`bar-${p.toLowerCase()}`} style={{ width: `${(data[p] / max) * 100}%` }} />
          </div>
          <b>{data[p]}</b>
        </div>
      ))}
    </div>
  );
}
