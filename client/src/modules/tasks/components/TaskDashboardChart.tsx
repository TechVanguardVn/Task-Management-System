import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { Task } from '@/modules/tasks/types/taskType';

type TaskDashboardChartProps = {
  tasks: Task[];
};

const statusConfig = [
  { key: 'TODO', label: 'Chưa bắt đầu', color: '#38bdf8' },
  { key: 'IN_PROGRESS', label: 'Đang làm', color: '#f59e0b' },
  { key: 'DONE', label: 'Hoàn thành', color: '#10b981' },
] as const;

export const TaskDashboardChart = ({ tasks }: TaskDashboardChartProps) => {
  const counts = statusConfig.map(({ key, label, color }) => ({
    key,
    label,
    value: tasks.filter((task) => task.status === key).length,
    color,
  }));

  const total = counts.reduce((sum, item) => sum + item.value, 0) || 1;
  const chartData = counts.map((item) => ({
    ...item,
    percent: total ? Math.round((item.value / total) * 100) : 0,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-600">Overview</p>
          <h3 className="mt-1 text-lg font-bold text-slate-800">Biểu đồ tiến độ</h3>
        </div>

        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
          {tasks.length} công việc
        </span>
      </div>

      <div className="grid items-center gap-6 md:grid-cols-[220px_1fr]">
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                innerRadius={48}
                outerRadius={82}
                paddingAngle={3}
                cornerRadius={12}
              >
                {chartData.map((item) => (
                  <Cell key={item.key} fill={item.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {chartData.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>

              <div className="text-right">
                <span className="text-base font-bold text-slate-800">{item.value}</span>
                <span className="ml-2 text-xs text-slate-500">({item.percent}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
