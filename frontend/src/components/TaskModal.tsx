import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Trash2, X } from 'lucide-react';
import { fieldErrors } from '../api/client';
import { useCreateTask, useDeleteTask, useUpdateTask } from '../api/hooks';
import { PRIORITIES, STATUSES, type Task, type TaskPriority, type TaskStatus } from '../api/types';
import { PRIORITY_LABEL, STATUS_LABEL, fromDateInput, toDateInput } from '../lib/format';
import { useToast } from './Toast';

export type ModalState = { mode: 'create'; status?: TaskStatus } | { mode: 'edit'; task: Task } | null;

export function TaskModal({ state, onClose }: { state: ModalState; onClose: () => void }) {
  if (!state) return null;
  const key = state.mode === 'edit' ? state.task.id : `new-${state.status ?? 'TODO'}`;
  return <TaskForm key={key} state={state} onClose={onClose} />;
}

function TaskForm({ state, onClose }: { state: NonNullable<ModalState>; onClose: () => void }) {
  const editing = state.mode === 'edit' ? state.task : null;
  const toast = useToast();
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [status, setStatus] = useState<TaskStatus>(editing?.status ?? (state.mode === 'create' ? state.status : undefined) ?? 'TODO');
  const [priority, setPriority] = useState<TaskPriority>(editing?.priority ?? 'MEDIUM');
  const [due, setDue] = useState(toDateInput(editing?.dueDate ?? null));
  const [tags, setTags] = useState<string[]>(editing?.tags ?? []);
  const [tagDraft, setTagDraft] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const addTag = () => {
    const t = tagDraft.trim().replace(/^#/, '').toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) setTags([...tags, t.slice(0, 30)]);
    setTagDraft('');
  };
  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !tagDraft && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrors({ title: 'Tiêu đề không được để trống' });
      return;
    }
    const pendingTag = tagDraft.trim().replace(/^#/, '').toLowerCase();
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      dueDate: fromDateInput(due),
      tags: pendingTag && !tags.includes(pendingTag) ? [...tags, pendingTag] : tags,
    };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload });
        toast('Đã cập nhật công việc');
      } else {
        await create.mutateAsync(payload);
        toast('Đã tạo công việc mới');
      }
      onClose();
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(Object.keys(fe).length ? fe : { form: (err as Error).message });
    }
  };

  const onDelete = async () => {
    if (!editing) return;
    try {
      await remove.mutateAsync(editing.id);
      toast('Đã xoá công việc');
      onClose();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const saving = create.isPending || update.isPending;

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
        <div className="modal-head">
          <h2 id="task-modal-title">{editing ? 'Chỉnh sửa công việc' : 'Tạo công việc mới'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <label className="field">
            <span>Tiêu đề *</span>
            <input
              ref={titleRef}
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thiết kế trang chủ"
              aria-invalid={!!errors.title}
            />
            {errors.title && <em className="error">{errors.title}</em>}
          </label>

          <label className="field">
            <span>Mô tả</span>
            <textarea
              value={description}
              maxLength={5000}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chi tiết công việc (không bắt buộc)"
            />
            {errors.description && <em className="error">{errors.description}</em>}
          </label>

          <div className="field">
            <span>Trạng thái</span>
            <div className="segmented">
              {STATUSES.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={status === s ? `active seg-${s.toLowerCase()}` : ''}
                  onClick={() => setStatus(s)}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <span>Mức ưu tiên</span>
              <div className="segmented">
                {[...PRIORITIES].reverse().map((p) => (
                  <button
                    type="button"
                    key={p}
                    className={priority === p ? `active seg-p-${p.toLowerCase()}` : ''}
                    onClick={() => setPriority(p)}
                  >
                    {PRIORITY_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>
            <label className="field">
              <span>Hạn hoàn thành</span>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
              {errors.dueDate && <em className="error">{errors.dueDate}</em>}
            </label>
          </div>

          <div className="field">
            <span>Tags</span>
            <div className="tag-input">
              {tags.map((t) => (
                <span key={t} className="tag">
                  # {t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Bỏ tag ${t}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={onTagKey}
                onBlur={addTag}
                placeholder={tags.length ? '' : 'Nhập tag rồi nhấn Enter'}
              />
            </div>
            {errors.tags && <em className="error">{errors.tags}</em>}
          </div>

          {errors.form && <div className="alert">{errors.form}</div>}
        </div>

        <div className="modal-foot">
          {editing &&
            (confirmDelete ? (
              <div className="confirm">
                <span>Xoá vĩnh viễn?</span>
                <button type="button" className="btn btn-danger" onClick={onDelete} disabled={remove.isPending}>
                  Xoá
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
                  Không
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-ghost danger-text" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} /> Xoá
              </button>
            ))}
          <div className="spacer" />
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo công việc'}
          </button>
        </div>
      </form>
    </div>
  );
}
