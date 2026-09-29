import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { getTasks, updateTaskStatus } from "../api/tasks";
import { PriorityBadge } from "../components/TaskBadge";
import { useToast } from "../components/Toast";
import type { Task, TaskStatus } from "../types";

const columns: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "Cần làm" },
  { status: "IN_PROGRESS", label: "Đang làm" },
  { status: "DONE", label: "Hoàn thành" },
];
export function Kanban() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [active, setActive] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  useEffect(() => {
    Promise.all(columns.map(({ status }) => getTasks({ status, size: 100 })))
      .then((pages) => setTasks(pages.flatMap((page) => page.content)))
      .catch(() => showToast("Không thể tải bảng.", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);
  const onDragStart = ({ active: eventActive }: DragStartEvent) =>
    setActive(
      tasks.find((task) => String(task.id) === String(eventActive.id)) || null,
    );
  const onDragEnd = async ({ active: eventActive, over }: DragEndEvent) => {
    setActive(null);
    if (!over) return;
    const task = tasks.find(
      (item) => String(item.id) === String(eventActive.id),
    );
    const target = columns.find((column) => column.status === String(over.id));
    if (!task || !target || task.status === target.status) return;
    const previous = tasks;
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status: target.status } : item,
      ),
    );
    try {
      await updateTaskStatus(task.id, target.status);
      showToast("Đã cập nhật trạng thái.");
    } catch {
      setTasks(previous);
      showToast("Không thể cập nhật trạng thái, đã hoàn tác.", "error");
    }
  };
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Bảng</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kéo công việc sang cột mới để đổi trạng thái.
        </p>
      </div>
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {columns.map((column) => (
            <div
              key={column.status}
              className="h-80 animate-pulse rounded-lg bg-slate-200"
            />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {columns.map((column) => (
              <KanbanColumn
                key={column.status}
                {...column}
                tasks={tasks.filter((task) => task.status === column.status)}
              />
            ))}
          </div>
          <DragOverlay>{active && <TaskCard task={active} />}</DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
function KanbanColumn({
  status,
  label,
  tasks,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
}) {
  const { setNodeRef } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className="min-h-72 rounded-lg border border-slate-200 bg-slate-100 p-3"
    >
      <h2 className="mb-3 text-sm font-bold text-slate-700">
        {label}{" "}
        <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-xs">
          {tasks.length}
        </span>
      </h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <DraggableCard key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}
function DraggableCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
  });
  return (
    <div
      ref={setNodeRef}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
          : undefined
      }
      {...listeners}
      {...attributes}
    >
      <TaskCard task={task} />
    </div>
  );
}
function TaskCard({ task }: { task: Task }) {
  return (
    <article className="cursor-grab rounded-md border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing">
      <p className="font-medium text-slate-800">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {task.description}
        </p>
      )}
      <div className="mt-3">
        <PriorityBadge priority={task.priority} />
      </div>
    </article>
  );
}
