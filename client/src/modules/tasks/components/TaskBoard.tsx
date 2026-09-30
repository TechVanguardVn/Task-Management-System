import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/modules/tasks/types/taskType';
import type { TaskBoardProps, TaskCardProps, TaskColumnProps } from '@/modules/tasks/types/taskBoardType';

function TaskCard({
  task,
  onEdit,
  onView,
  onDelete,
  onStatusChange,
  statusLabelMap,
  priorityLabelMap,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-opacity active:cursor-grabbing ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <button type="button" onClick={() => onView(task)} className="text-left font-semibold text-gray-800 text-sm hover:text-blue-600">
          {task.title}
        </button>

        <button
          type="button"
          onClick={() => onEdit(task)}
          className="text-xs text-blue-600 hover:underline"
        >
          Sửa
        </button>
      </div>

      {task.description && <p className="mb-2 text-xs text-gray-600 line-clamp-3">{task.description}</p>}

      <div className="mb-2 flex items-center justify-between text-[11px] text-gray-500">
        <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">{priorityLabelMap[task.priority]}</span>
        {task.due_date && <span>Hạn: {task.due_date}</span>}
      </div>

      <div className="flex items-center justify-between gap-2">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task, e.target.value as Task['status'])}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="TODO">{statusLabelMap.TODO}</option>
          <option value="IN_PROGRESS">{statusLabelMap.IN_PROGRESS}</option>
          <option value="DONE">{statusLabelMap.DONE}</option>
        </select>

        <button
          type="button"
          onClick={() => onView(task)}
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          Xem
        </button>

        <button
          type="button"
          onClick={() => onDelete(task)}
          className="text-xs text-red-500 hover:text-red-700"
        >
          Xóa
        </button>
      </div>
    </div>
  );
}

function TaskColumn({
  column,
  columnTasks,
  currentPage,
  totalPages,
  onEdit,
  onView,
  onDelete,
  onStatusChange,
  onChangePage,
  statusLabelMap,
  priorityLabelMap,
}: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[320px] rounded-xl border border-gray-200 ${column.color} p-3 transition-all ${
        isOver ? 'ring-2 ring-blue-400 ring-offset-1' : ''
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{column.title}</h3>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-700">
          {columnTasks.length}
        </span>
      </div>

      <div className="space-y-3">
        {columnTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white/60 p-4 text-center text-sm text-gray-500">
            Không có task
          </div>
        ) : (
          columnTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              statusLabelMap={statusLabelMap}
              priorityLabelMap={priorityLabelMap}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-200 pt-3">
          <button
            type="button"
            onClick={() => onChangePage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>

          <span className="text-[11px] text-gray-600">
            {currentPage}/{totalPages}
          </span>

          <button
            type="button"
            onClick={() => onChangePage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}

export const TaskBoard = ({
  columns,
  paginatedTasksByStatus,
  loading,
  currentPageByStatus,
  totalPagesByStatus,
  onEdit,
  onView,
  onDelete,
  onStatusChange,
  onDropTask,
  statusLabelMap,
  priorityLabelMap,
  setCurrentPageByStatus,
}: TaskBoardProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;

    const taskId = Number(active.id);
    const targetStatus = over.id as Task['status'];

    if (!targetStatus) return;

    onDropTask(taskId, targetStatus);
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Đang tải dữ liệu...</div>;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {columns.map((column) => {
          const columnTasks = paginatedTasksByStatus[column.key] ?? [];

          return (
            <TaskColumn
              key={column.key}
              column={column}
              columnTasks={columnTasks}
              currentPage={currentPageByStatus[column.key] ?? 1}
              totalPages={totalPagesByStatus[column.key] ?? 1}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onChangePage={(value) => setCurrentPageByStatus(column.key, value)}
              statusLabelMap={statusLabelMap}
              priorityLabelMap={priorityLabelMap}
            />
          );
        })}
      </div>
    </DndContext>
  );
};
