import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faTableList, faUser } from '@fortawesome/free-solid-svg-icons';
import { Link, useLocation } from 'react-router-dom';



export const AppSidebar = () => {
  const location = useLocation();

  const sidebarItems = [
    { label: 'Bảng điều khiển', path: '/dashboard', icon: faTableList },
    { label: 'Công việc', path: '/tasks', icon: faClipboardList },
    { label: 'Hồ sơ', path: '/profile', icon: faUser },
  ];

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white/80 text-slate-700 shadow-sm backdrop-blur-sm lg:block">
      <div className="sticky top-[89px] flex h-[calc(100vh-89px)] flex-col p-5">
        <div className="mb-8">
        </div>

        <nav className="space-y-2">
          {sidebarItems.map(({ label, path, icon }) => {
            const isActive = location.pathname === path;

            return (
              <Link
                key={label}
                to={path}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <FontAwesomeIcon icon={icon} className="h-4 w-4" />
                  {label}
                </span>
                <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-sky-500' : 'bg-slate-300'}`} />
              </Link>
            );
          })}
        </nav>

      
      </div>
    </aside>
  );
};
