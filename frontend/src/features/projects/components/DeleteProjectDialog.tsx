import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { getFriendlyErrorMessage } from "../../../lib/api-client";
import type { Project } from "../../../types/project.types";
import { useDeleteProjectMutation } from "../hooks/useProjects";

interface DeleteProjectDialogProps {
  project: Project | null;
  onClose: () => void;
  onDeleted?: (projectId: string) => void;
}

export function DeleteProjectDialog({
  project,
  onClose,
  onDeleted,
}: DeleteProjectDialogProps) {
  const deleteMutation = useDeleteProjectMutation();

  useEffect(() => {
    if (!project) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !deleteMutation.isPending) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [project, deleteMutation.isPending, onClose]);

  if (!project) {
    return null;
  }

  const errorMessage = deleteMutation.error
    ? getFriendlyErrorMessage(deleteMutation.error)
    : null;

  const handleConfirmDelete = async () => {
    const targetId = project.id;
    await deleteMutation.mutateAsync(targetId);
    onDeleted?.(targetId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleteMutation.isPending) {
          onClose();
        }
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
        aria-describedby="delete-project-desc"
        className="bento-card w-full max-w-md rounded-3xl p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            aria-label="Close dialog"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-zinc-900"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <h2
          id="delete-project-title"
          className="font-heading text-xl font-semibold text-zinc-900"
        >
          Delete Project?
        </h2>

        <p
          id="delete-project-desc"
          className="mt-2 text-sm leading-relaxed text-slate-600"
        >
          Are you sure you want to delete{" "}
          <span className="font-semibold text-zinc-900">“{project.name}”</span>?
          {project.stats.totalTasks > 0 ? (
            <>
              {" "}
              All{" "}
              <span className="font-semibold text-red-600">
                {project.stats.totalTasks} tasks
              </span>{" "}
              inside this project will also be permanently deleted.
            </>
          ) : (
            " This action cannot be undone."
          )}
        </p>

        {errorMessage ? (
          <div
            role="alert"
            className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="min-h-[40px] cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirmDelete()}
            disabled={deleteMutation.isPending}
            className="inline-flex min-h-[40px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Delete Project</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
