import type { Task } from '@/modules/tasks/types/taskType';

type TaskPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  borderClass: string;
};

const TaskPagination = ({ currentPage, totalPages, onPrev, onNext, borderClass }: TaskPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`mt-4 flex items-center justify-between border-t pt-3 ${borderClass}`}>
      <button
        type="button"
        onClick={onPrev}
        disabled={currentPage === 1}
        className={`rounded-lg border px-2 py-1 text-xs disabled:opacity-50 ${borderClass}`}
      >
        Trước
      </button>
      <span className="text-xs text-gray-600">
        {currentPage}/{totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={currentPage === totalPages}
        className={`rounded-lg border px-2 py-1 text-xs disabled:opacity-50 ${borderClass}`}
      >
        Sau
      </button>
    </div>
  );
};

type DeadlineItemCardProps = {
  task: Task;
  badgeText: string;
  badgeClass: string;
  priorityClass: string;
  priorityLabel: string;
  onView?: (task: Task) => void;
};

const DeadlineItemCard = ({ task, badgeText, badgeClass, priorityClass, priorityLabel, onView }: DeadlineItemCardProps) => (
  <button
    type="button"
    onClick={() => onView?.(task)}
    className="w-full rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 text-left shadow-sm transition hover:border-sky-200 hover:bg-sky-50/30"
  >
    <div className="cursor-pointer mb-1.5 flex items-start justify-between gap-2">
      <p className="line-clamp-2 text-sm font-semibold text-gray-800">{task.title}</p>
      <span className={`rounded-full border bg-white px-1.5 py-0.5 text-[9px] font-medium ${badgeClass}`}>
        {badgeText}
      </span>
    </div>

    <div className="flex items-center justify-between gap-2 text-[11px] text-gray-600">
      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 ${priorityClass}`}>
        {priorityLabel}
      </span>
      <span>Hạn: {task.due_date}</span>
    </div>
  </button>
);

type DeadlinePanelProps = {
  title: string;
  count: number;
  emptyText: string;
  tasks: Task[];
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  badgeText: string;
  badgeClass: string;
  priorityClass: string;
  panelClass: string;
  titleClass: string;
  countClass: string;
  emptyClass: string;
  borderClass: string;
  priorityLabelMap: Record<Task['priority'], string>;
  onView?: (task: Task) => void;
};

const DeadlinePanel = ({
  title,
  count,
  emptyText,
  tasks,
  currentPage,
  totalPages,
  onPrev,
  onNext,
  badgeText,
  badgeClass,
  priorityClass,
  panelClass,
  titleClass,
  countClass,
  emptyClass,
  borderClass,
  priorityLabelMap,
  onView,
}: DeadlinePanelProps) => (
  <div className={`rounded-2xl border bg-white p-4 shadow-sm ${panelClass}`}>
    <div className="mb-3 flex items-center justify-between">
      <h2 className={`text-lg font-bold ${titleClass}`}>{title}</h2>
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${countClass}`}>{count} việc</span>
    </div>

    {tasks.length === 0 ? (
      <div className={`rounded-xl border border-dashed px-3 py-5 text-center text-sm text-gray-500 ${emptyClass}`}>
        {emptyText}
      </div>
    ) : (
      <>
        <div className="grid gap-2">
          {tasks.map((task) => (
            <DeadlineItemCard
              key={task.id}
              task={task}
              badgeText={badgeText}
              badgeClass={badgeClass}
              priorityClass={priorityClass}
              priorityLabel={priorityLabelMap[task.priority]}
              onView={onView}
            />
          ))}
        </div>

        <TaskPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={onPrev}
          onNext={onNext}
          borderClass={borderClass}
        />
      </>
    )}
  </div>
);

type TaskDeadlineSectionProps = {
  overdueTasks: Task[];
  upcomingTasks: Task[];
  overduePage: number;
  upcomingPage: number;
  overdueTotalPages: number;
  upcomingTotalPages: number;
  setOverduePage: (value: number | ((prev: number) => number)) => void;
  setUpcomingPage: (value: number | ((prev: number) => number)) => void;
  statusLabelMap: Record<Task['status'], string>;
  priorityLabelMap: Record<Task['priority'], string>;
  onTaskView?: (task: Task) => void;
};

export const TaskDeadlineSection = ({
  overdueTasks,
  upcomingTasks,
  overduePage,
  upcomingPage,
  overdueTotalPages,
  upcomingTotalPages,
  setOverduePage,
  setUpcomingPage,
  statusLabelMap,
  priorityLabelMap,
  onTaskView,
}: TaskDeadlineSectionProps) => {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <DeadlinePanel
        title="Công việc quá hạn"
        count={overdueTasks.length}
        emptyText="Không có công việc nào quá hạn."
        tasks={overdueTasks}
        currentPage={overduePage}
        totalPages={overdueTotalPages}
        onPrev={() => setOverduePage((prev: number) => Math.max(1, prev - 1))}
        onNext={() => setOverduePage((prev: number) => Math.min(overdueTotalPages, prev + 1))}
        badgeText="Quá hạn"
        badgeClass="border-red-200 text-red-700"
        priorityClass="bg-red-100 text-red-700"
        panelClass="border-red-200"
        titleClass="text-red-700"
        countClass="bg-red-100 text-red-700"
        emptyClass="border-red-200 bg-red-50"
        borderClass="border-red-200 text-red-700"
        priorityLabelMap={priorityLabelMap}
        onView={onTaskView}
      />

      <DeadlinePanel
        title="Công việc sắp đến hạn"
        count={upcomingTasks.length}
        emptyText="Không có công việc nào sắp đến hạn."
        tasks={upcomingTasks}
        currentPage={upcomingPage}
        totalPages={upcomingTotalPages}
        onPrev={() => setUpcomingPage((prev: number) => Math.max(1, prev - 1))}
        onNext={() => setUpcomingPage((prev: number) => Math.min(upcomingTotalPages, prev + 1))}
        badgeText={statusLabelMap.TODO}
        badgeClass="border-orange-200 text-orange-700"
        priorityClass="bg-orange-100 text-orange-700"
        panelClass="border-orange-200"
        titleClass="text-gray-800"
        countClass="bg-orange-100 text-orange-700"
        emptyClass="border-orange-200 bg-orange-50"
        borderClass="border-orange-200 text-orange-700"
        priorityLabelMap={priorityLabelMap}
        onView={onTaskView}
      />
    </section>
  );
};
