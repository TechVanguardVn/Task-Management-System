import { Link } from 'react-router-dom';
import { useRegisterForm } from '@/modules/auth/hooks/useRegisterForm';

export default function RegisterPage() {
  const {
    formData,
    errors,
    generalError,
    loading,
    handleChange,
    handleSubmit,
  } = useRegisterForm();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-100 px-4 py-10">
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-200/60 blur-3xl" />
      <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-indigo-200/60 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(139,92,246,0.10)] backdrop-blur-xl lg:grid-cols-[1.05fr_1.2fr]">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-500 p-8 text-white lg:flex">
          <div>
            <p className="text-2xl font-semibold">Task Management System</p>
          </div>

          <div>
            <h2 className="text-4xl font-bold leading-tight">Bắt đầu với hệ thống quản lí công việc.</h2>
          </div>

          <div className="space-y-4 text-sm text-violet-50">
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold">✓</span>
              Tạo tài khoản nhanh chóng
            </div>
           
          </div>
        </div>

        <div className="bg-slate-50/80 p-6 sm:p-8 lg:p-10">
          <div className="mb-8 text-center lg:text-left">
            <p className="text-xs font-semibold tracking-[0.28em] text-violet-500">TASK MANAGEMENT SYSTEM</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Đăng ký</h1>
          </div>

          {generalError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Họ và tên</label>
              <input
                type="text"
                name="name"
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                placeholder="Nguyễn Văn A"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name[0]}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email[0]}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu</label>
              <input
                type="password"
                name="password"
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                placeholder="Ít nhất 8 ký tự"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password[0]}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Xác nhận mật khẩu</label>
              <input
                type="password"
                name="password_confirmation"
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                placeholder="Nhập lại mật khẩu"
                value={formData.password_confirmation}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-violet-600 hover:text-violet-500">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
