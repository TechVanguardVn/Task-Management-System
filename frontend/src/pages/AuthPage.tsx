import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { fieldErrors } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/Badges';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setBusy(true);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true });
    } catch (err) {
      const fe = fieldErrors(err);
      setErrors(Object.keys(fe).length ? fe : { form: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@taskflow.dev');
    setPassword('Demo@1234');
  };

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit} noValidate>
        <Logo size={32} />
        <h1>{isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</h1>
        <p className="muted">
          {isLogin ? 'Đăng nhập để tiếp tục quản lý công việc.' : 'Bắt đầu sắp xếp công việc chỉ trong vài giây.'}
        </p>

        {!isLogin && (
          <label className="field">
            <span>Họ tên</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Nguyễn Văn A" />
            {errors.name && <em className="error">{errors.name}</em>}
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="ban@example.com"
          />
          {errors.email && <em className="error">{errors.email}</em>}
        </label>
        <label className="field">
          <span>Mật khẩu</span>
          <div className="password">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder={isLogin ? '••••••••' : 'Tối thiểu 8 ký tự, gồm chữ và số'}
            />
            <button type="button" className="icon-btn" onClick={() => setShow((v) => !v)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <em className="error">{errors.password}</em>}
        </label>

        {errors.form && <div className="alert">{errors.form}</div>}

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
        </button>

        {isLogin && (
          <button type="button" className="demo-hint" onClick={fillDemo}>
            Dùng tài khoản demo: <b>demo@taskflow.dev</b> / <b>Demo@1234</b>
          </button>
        )}

        <p className="auth-switch">
          {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Đăng ký' : 'Đăng nhập'}</Link>
        </p>
      </form>
    </div>
  );
}
