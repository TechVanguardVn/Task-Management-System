import { useEffect, useState, type FormEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutGrid, ListTodo, LogOut, Menu, Search, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { initials } from '../lib/format';
import { Logo } from './Badges';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('search') ?? '');
  const [navOpen, setNavOpen] = useState(false);

  // Đồng bộ ô tìm kiếm khi URL thay đổi (vd. xoá bộ lọc ở trang Tasks)
  useEffect(() => {
    setQuery(params.get('search') ?? '');
  }, [params]);
  useEffect(() => setNavOpen(false), [location.pathname]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(location.pathname === '/tasks' ? window.location.search : undefined);
    if (query.trim()) next.set('search', query.trim());
    else next.delete('search');
    next.delete('page');
    navigate(`/tasks?${next.toString()}`);
  };

  return (
    <div className={`shell ${navOpen ? 'nav-open' : ''}`}>
      <header className="topbar">
        <button className="icon-btn menu-btn" onClick={() => setNavOpen((v) => !v)} aria-label="Mở menu">
          {navOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <Logo />
        <div className="topbar-right">
          <form className="search" onSubmit={onSearch} role="search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm công việc..."
              aria-label="Tìm công việc theo tiêu đề"
            />
          </form>
          <div className="avatar" title={user?.email}>
            {initials(user?.name ?? '?')}
          </div>
        </div>
      </header>

      <aside className="sidebar">
        <div className="nav-section">Tổng quan</div>
        <NavLink to="/dashboard" className="nav-item">
          <LayoutGrid size={17} /> Dashboard
        </NavLink>
        <NavLink to="/tasks" className="nav-item">
          <ListTodo size={17} /> Công việc
        </NavLink>

        <div className="sidebar-bottom">
          <div className="me">
            <div className="avatar avatar-sm">{initials(user?.name ?? '?')}</div>
            <div className="me-text">
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button className="nav-item" onClick={() => logout().then(() => navigate('/login'))}>
            <LogOut size={17} /> Đăng xuất
          </button>
        </div>
      </aside>
      <div className="scrim" onClick={() => setNavOpen(false)} />

      <main className="panel">
        <Outlet />
      </main>
    </div>
  );
}
