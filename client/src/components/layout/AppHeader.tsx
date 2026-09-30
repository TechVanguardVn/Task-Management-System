import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket, faHouse, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

type TaskHeaderProps = {
  userName?: string;
  onLogout: () => void;
};

export const AppHeader = ({ userName, onLogout }: TaskHeaderProps) => {

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-base font-bold text-white shadow-sm">
            <FontAwesomeIcon icon={faHouse} className="h-4 w-4" />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-800">Task Management System</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500 md:block">
            Hôm nay • 30/09/2026
          </div>

          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm transition hover:border-sky-200 hover:bg-sky-50"
          >
           

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-slate-800">{userName || 'User'}</p>
            </div>
            <FontAwesomeIcon icon={faUserCircle} className="h-4 w-4 text-slate-500" />
          </Link>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-3.5 w-3.5" />
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
};
