import { FolderKanban } from "lucide-react";

export function ProjectsPlaceholderPage() {
  return (
    <section className="bento-card rounded-3xl p-8 text-center sm:p-12">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-zinc-900">
        <FolderKanban className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="font-heading text-2xl font-semibold text-zinc-900">
        Dự án của tôi
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        Không gian quản lý danh sách Project và Task sẽ được kết nối ở nhánh tính năng tiếp theo.
      </p>
    </section>
  );
}
