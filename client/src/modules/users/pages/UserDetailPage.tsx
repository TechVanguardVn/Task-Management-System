import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEnvelope, faUser } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

export default function UserDetailPage() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-700">Không tìm thấy thông tin người dùng.</p>
      </div>
    );
  }

  const initials = user.name?.charAt(0)?.toUpperCase() || 'U';

  const profileItems = [
    {
      label: 'Họ và tên',
      value: user.name,
      icon: faUser,
    },
    {
      label: 'Email',
      value: user.email,
      icon: faEnvelope,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-2xl font-bold text-sky-700">
              {initials}
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-600">Thông tin</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-800">{user.name}</h2>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
            Về dashboard
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-slate-800">Thông tin cá nhân</h3>
        </div>

        <div className="space-y-4">
          {profileItems.map(({ label, value, icon }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <FontAwesomeIcon icon={icon} className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{label}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
