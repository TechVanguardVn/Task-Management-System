import type { Task } from './taskType';

export interface TaskBoardColumn {
  key: Task['status'];
  title: string;
  color: string;
}

export interface TaskBoardProps {
  columns: TaskBoardColumn[];
  paginatedTasksByStatus: Record<Task['status'], Task[]>;
  loading: boolean;
  filteredTasks: Task[];
  currentPageByStatus: Record<Task['status'], number>;
  totalPagesByStatus: Record<Task['status'], number>;
  pageSize: number;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: Task['status']) => void;
  onDropTask: (taskId: number, status: Task['status']) => void;
  statusLabelMap: Record<Task['status'], string>;
  priorityLabelMap: Record<Task['priority'], string>;
  setCurrentPageByStatus: (status: Task['status'], value: number | ((prev: number) => number)) => void;
}

export interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: Task['status']) => void;
  statusLabelMap: Record<Task['status'], string>;
  priorityLabelMap: Record<Task['priority'], string>;
}

export interface TaskColumnProps {
  column: TaskBoardColumn;
  columnTasks: Task[];
  currentPage: number;
  totalPages: number;
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: Task['status']) => void;
  onChangePage: (value: number | ((prev: number) => number)) => void;
  statusLabelMap: Record<Task['status'], string>;
  priorityLabelMap: Record<Task['priority'], string>;
}
