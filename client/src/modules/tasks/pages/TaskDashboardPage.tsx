import { useState } from 'react';
import { TaskDashboardChart } from '@/modules/tasks/components/TaskDashboardChart';
import { TaskDeadlineSection } from '@/modules/tasks/components/TaskDeadlineSection';
import { TaskDetailModal } from '@/modules/tasks/components/TaskDetailModal';
import { TaskSummarySection } from '@/modules/tasks/components/TaskSummarySection';
import { priorityLabelMap, statusLabelMap, useTaskDeadlineState, useTaskSummary } from '@/modules/tasks/hooks/useTaskBoard';
import { useTaskData } from '@/modules/tasks/hooks/useTaskData';
import type { Task } from '@/modules/tasks/types/taskType';

export default function TaskDashboardPage() {
  const taskData = useTaskData();
  const summary = useTaskSummary(taskData.tasks);
  const deadline = useTaskDeadlineState(taskData.tasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { todoCount, inProgressCount, completedCount } = summary;

  const {
    upcomingPage,
    overduePage,
    upcomingTotalPages,
    overdueTotalPages,
    paginatedUpcomingTasks,
    paginatedOverdueTasks,
    setUpcomingPage,
    setOverduePage,
  } = deadline;

  return (
    <>
      <TaskSummarySection
        tasksCount={taskData.tasks.length}
        todoCount={todoCount}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
      />

      <TaskDashboardChart tasks={taskData.tasks} />

      <TaskDeadlineSection
        overdueTasks={paginatedOverdueTasks}
        upcomingTasks={paginatedUpcomingTasks}
        overduePage={overduePage}
        upcomingPage={upcomingPage}
        overdueTotalPages={overdueTotalPages}
        upcomingTotalPages={upcomingTotalPages}
        setOverduePage={setOverduePage}
        setUpcomingPage={setUpcomingPage}
        statusLabelMap={statusLabelMap}
        priorityLabelMap={priorityLabelMap}
        onTaskView={setSelectedTask}
      />

      <TaskDetailModal isOpen={!!selectedTask} task={selectedTask} onClose={() => setSelectedTask(null)} />
    </>
  );
}
