import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CirclePlus } from 'lucide-react';
import { useMoveTask } from '../api/hooks';
import { STATUSES, type Board, type Task, type TaskStatus } from '../api/types';
import { STATUS_LABEL } from '../lib/format';
import { TaskCard } from './TaskCard';
import { useToast } from './Toast';

interface Props {
  board: Board;
  onOpen: (task: Task) => void;
  onAdd: (status: TaskStatus) => void;
}

export function KanbanBoard({ board, onOpen, onAdd }: Props) {
  const [columns, setColumns] = useState<Board>(board);
  const [activeId, setActiveId] = useState<string | null>(null);
  const origin = useRef<{ status: TaskStatus; index: number } | null>(null);
  const move = useMoveTask();
  const toast = useToast();

  // Nhận dữ liệu mới từ server khi không kéo thả
  useEffect(() => {
    if (!activeId) setColumns(board);
  }, [board, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columnOf = (id: string, cols: Board = columns): TaskStatus | undefined => {
    if ((STATUSES as string[]).includes(id)) return id as TaskStatus;
    return STATUSES.find((s) => cols[s].some((t) => t.id === id));
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id);
    const status = columnOf(id)!;
    origin.current = { status, index: columns[status].findIndex((t) => t.id === id) };
    setActiveId(id);
  };

  // Kéo sang cột khác: chuyển thẻ ngay để cột đích mở chỗ trống
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const id = String(active.id);
    const overId = String(over.id);
    setColumns((prev) => {
      const from = columnOf(id, prev);
      const to = columnOf(overId, prev);
      if (!from || !to || from === to) return prev;
      const item = prev[from].find((t) => t.id === id)!;
      const target = prev[to];
      let index = target.length;
      const overIndex = target.findIndex((t) => t.id === overId);
      if (overIndex >= 0) {
        const translated = active.rect.current.translated;
        const below = translated ? translated.top > over.rect.top + over.rect.height / 2 : false;
        index = overIndex + (below ? 1 : 0);
      }
      return {
        ...prev,
        [from]: prev[from].filter((t) => t.id !== id),
        [to]: [...target.slice(0, index), { ...item, status: to }, ...target.slice(index)],
      };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id);
    setActiveId(null);
    const start = origin.current;
    origin.current = null;
    if (!over || !start) {
      setColumns(board);
      return;
    }

    const status = columnOf(id);
    if (!status) return;
    let items = columns[status];
    const oldIndex = items.findIndex((t) => t.id === id);
    const overId = String(over.id);
    const overIndex = overId === status ? items.length - 1 : items.findIndex((t) => t.id === overId);
    if (overIndex >= 0 && overIndex !== oldIndex) items = arrayMove(items, oldIndex, overIndex);

    const finalIndex = items.findIndex((t) => t.id === id);
    if (status === start.status && finalIndex === start.index) {
      setColumns(board);
      return;
    }

    setColumns((prev) => ({ ...prev, [status]: items }));
    move.mutate(
      { id, status, afterId: finalIndex > 0 ? items[finalIndex - 1].id : null },
      {
        onSuccess: () => {
          if (status !== start.status) toast(`Đã chuyển sang "${STATUS_LABEL[status]}"`);
        },
        onError: (err) => {
          toast(err.message, 'error');
          setColumns(board);
        },
      },
    );
  };

  const activeTask = activeId ? STATUSES.flatMap((s) => columns[s]).find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setColumns(board);
      }}
    >
      <div className="board">
        {STATUSES.map((status) => (
          <Column key={status} status={status} tasks={columns[status]} onOpen={onOpen} onAdd={onAdd} />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' }}>
        {activeTask ? <TaskCard task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  status,
  tasks,
  onOpen,
  onAdd,
}: {
  status: TaskStatus;
  tasks: Task[];
  onOpen: (t: Task) => void;
  onAdd: (s: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section className={`column ${isOver ? 'column-over' : ''}`} aria-label={STATUS_LABEL[status]}>
      <header className="column-head">
        <h2>
          <i className={`dot dot-${status.toLowerCase()}`} />
          {STATUS_LABEL[status]}
        </h2>
        <span className="count">{tasks.length}</span>
      </header>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="column-body">
          {tasks.map((t) => (
            <SortableCard key={t.id} task={t} onOpen={onOpen} />
          ))}
          {tasks.length === 0 && <div className="column-empty">Kéo thả công việc vào đây</div>}
        </div>
      </SortableContext>
      <button className="add-task" onClick={() => onAdd(status)}>
        <CirclePlus size={16} /> Thêm công việc
      </button>
    </section>
  );
}

function SortableCard({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`sortable ${isDragging ? 'is-dragging' : ''}`}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(task);
      }}
      {...attributes}
      {...listeners}
      aria-label={`${task.title}. Nhấn Space để kéo, Enter để mở`}
    >
      <TaskCard task={task} />
    </div>
  );
}
