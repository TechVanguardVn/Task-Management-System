import { Link } from 'react-router-dom';
import { useLoginForm } from '@/modules/auth/hooks/useLoginForm';

export default function LoginPage() {
  const {
    email,
    password,
    errorMsg,
    loading,
    setEmail,
    setPassword,
    handleSubmit,
  } = useLoginForm();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-white to-indigo-100 px-4 py-10">
      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-indigo-200/60 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-violet-200/60 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_20px_60px_rgba(79,70,229,0.10)] backdrop-blur-xl lg:grid-cols-[1.05fr_1.2fr]">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-500 p-8 text-white lg:flex">
          <div>
            <p className="text-2xl font-semibold">Task Management System</p>
          </div>

          <div>
            <h2 className="text-4xl font-bold leading-tight">Quản lý việc làm rõ ràng hơn.</h2>
          </div>

          <div className="space-y-4 text-sm text-indigo-50">
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-bold">✓</span>
              Theo dõi tiến độ nhanh chóng
            </div>
          
          </div>
        </div>

        <div className="bg-slate-50/80 p-6 sm:p-8 lg:p-10">
          <div className="mb-8 text-center lg:text-left">
            <p className="text-xs font-semibold tracking-[0.28em] text-indigo-500">TASK MANAGEMENT SYSTEM</p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">Đăng nhập</h1>
          </div>

          {errorMsg && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
