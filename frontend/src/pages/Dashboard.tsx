import { CheckCircle2, CircleDashed, Clock3, ListTodo } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../api/tasks";
import { daysUntil } from "../lib/task";
import type { Dashboard as DashboardData, Task } from "../types";
import { StatusBadge } from "../components/TaskBadge";

const cards = [
  {
    key: "total",
    label: "Tổng công việc",
    icon: ListTodo,
    tone: "text-slate-700 bg-slate-100",
  },
  {
    key: "todo",
    label: "Cần làm",
    icon: CircleDashed,
    tone: "text-sky-700 bg-sky-100",
  },
  {
    key: "inProgress",
    label: "Đang làm",
    icon: Clock3,
    tone: "text-amber-700 bg-amber-100",
  },
  {
    key: "done",
    label: "Hoàn thành",
    icon: CheckCircle2,
    tone: "text-emerald-700 bg-emerald-100",
  },
] as const;
export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError("Không thể tải dữ liệu tổng quan."));
  }, []);
  if (error)
    return (
      <div>
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="mt-6 text-red-700">{error}</p>
      </div>
    );
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Nắm nhanh khối lượng công việc và các hạn sắp tới.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ key, label, icon: Icon, tone }) => (
          <section
            key={key}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className={`inline-flex rounded-md p-2 ${tone}`}>
              <Icon size={20} />
            </div>
            <p className="mt-4 text-2xl font-bold">
              {data ? (
                data[key]
              ) : (
                <span className="inline-block h-7 w-10 animate-pulse rounded bg-slate-200" />
              )}
            </p>
            <h2 className="mt-1 text-sm text-slate-600">{label}</h2>
          </section>
        ))}
      </div>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <h2 className="font-bold">Sắp đến hạn</h2>
          <p className="mt-1 text-sm text-slate-500">
            Các công việc cần được ưu tiên xử lý.
          </p>
        </div>
        {!data ? (
          <div className="h-36 animate-pulse bg-slate-100" />
        ) : (
          <Upcoming
            tasks={data.upcomingTasks}
            onOpen={() => navigate("/tasks")}
          />
        )}
      </section>
    </div>
  );
}
function Upcoming({ tasks, onOpen }: { tasks: Task[]; onOpen: () => void }) {
  if (!tasks.length)
    return (
      <p className="p-8 text-center text-sm text-slate-500">
        Không có công việc nào sắp đến hạn.
      </p>
    );
  return (
    <ul className="divide-y divide-slate-200">
      {tasks.map((task) => {
        const days = daysUntil(task.dueDate);
        return (
          <li key={task.id}>
            <button
              onClick={onOpen}
              className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{task.title}</p>
                <div className="mt-1">
                  <StatusBadge status={task.status} />
                </div>
              </div>
              <span
                className={`text-sm font-medium ${days !== null && days < 0 ? "text-red-700" : "text-slate-600"}`}
              >
                {days === null
                  ? "Chưa có hạn"
                  : days < 0
                    ? `Quá hạn ${Math.abs(days)} ngày`
                    : days === 0
                      ? "Đến hạn hôm nay"
                      : `Còn ${days} ngày`}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
