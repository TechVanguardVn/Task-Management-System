import { ArrowRight, CheckCircle2, Clock, FolderKanban, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../../auth/hooks/useAuth";

export function DashboardPlaceholderPage() {
  const { data: user } = useCurrentUser();

  return (
    <div className="space-y-4">
      {/* Welcome Bento Banner */}
      <section className="bento-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Phiên làm việc đã xác thực</span>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-zinc-900 sm:text-3xl">
              Xin chào, {user?.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Tổng quan tiến độ dự án và các công việc cá nhân của bạn sẽ hiển thị tại đây.
            </p>
          </div>

          <Link
            to="/projects"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          >
            <span>Mở danh sách dự án</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Bento Preview Grid */}
      <section
        aria-label="Chỉ số tổng quan"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div className="bento-card rounded-3xl p-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-zinc-900">
            <FolderKanban className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium text-slate-500">Mô hình dữ liệu</p>
          <p className="font-heading mt-1 text-lg font-semibold text-zinc-900">
            User → Project → Task
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Mỗi công việc thuộc một dự án riêng biệt của bạn.
          </p>
        </div>

        <div className="bento-card rounded-3xl p-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium text-slate-500">Trạng thái công việc</p>
          <p className="font-heading mt-1 text-lg font-semibold text-zinc-900">
            TODO · IN_PROGRESS · DONE
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Tự động tính phần trăm hoàn thành theo từng Project.
          </p>
        </div>

        <div className="bento-card rounded-3xl p-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium text-slate-500">Tài khoản đang hoạt động</p>
          <p className="font-heading mt-1 truncate text-lg font-semibold text-zinc-900">
            {user?.email}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Bảo vệ bằng HttpOnly Cookie &amp; CSRF Token.
          </p>
        </div>
      </section>
    </div>
  );
}
