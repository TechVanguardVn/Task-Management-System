import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faClipboardList, faClock, faListCheck } from '@fortawesome/free-solid-svg-icons';

type SummaryTone = "default" | "slate" | "amber" | "emerald";

type SummaryCardProps = {
  label: string;
  value: number;
  tone: SummaryTone;
  icon: any;
};

const summaryCardStyles: Record<SummaryTone, string> = {
  default: "border-gray-200 bg-white text-gray-800",
  slate: "border-slate-200 bg-white text-slate-700",
  amber: "border-amber-200 bg-white text-amber-600",
  emerald: "border-emerald-200 bg-white text-emerald-600",
};

const TaskSummaryCard = ({ label, value, tone, icon }: SummaryCardProps) => (
  <div className={`rounded-xl border p-4 shadow-sm ${summaryCardStyles[tone]}`}>
    <div className="mb-3 flex items-center justify-between">
      <p className="text-sm text-gray-500">{label}</p>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-base text-slate-600">
        <FontAwesomeIcon icon={icon} />
      </span>
    </div>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

type TaskSummarySectionProps = {
  tasksCount: number;
  todoCount: number;
  inProgressCount: number;
  completedCount: number;
};

export const TaskSummarySection = ({
  tasksCount,
  todoCount,
  inProgressCount,
  completedCount,
}: TaskSummarySectionProps) => {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <TaskSummaryCard label="Tổng task" value={tasksCount} tone="default" icon={faClipboardList} />
      <TaskSummaryCard label="Chưa bắt đầu" value={todoCount} tone="slate" icon={faClock} />
      <TaskSummaryCard label="Đang thực hiện" value={inProgressCount} tone="amber" icon={faListCheck} />
      <TaskSummaryCard label="Đã hoàn thành" value={completedCount} tone="emerald" icon={faCheckCircle} />
    </section>
  );
};
