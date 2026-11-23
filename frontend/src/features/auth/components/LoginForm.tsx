import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

/**
 * Form xử lý đăng nhập người dùng.
 * Xử lý đầy đủ validation và thông báo lỗi thân thiện.
 */
export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    return searchParams.get('expired') ? 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' : null;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation cơ bản ở phía client
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }

    try {
      setIsLoading(true);
      await login({ email, password });
      navigate('/');
    } catch (err: unknown) {
      const serverMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setErrorMessage(serverMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3 text-xs font-medium rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
          {errorMessage}
        </div>
      )}

      <Input
        label="Địa chỉ Email"
        type="email"
        placeholder="ten@congty.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
      />

      <Input
        label="Mật khẩu"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Button type="submit" variant="primary" size="md" isLoading={isLoading} className="w-full">
        Đăng nhập
      </Button>

      <div className="text-center text-xs text-gray-500 dark:text-zinc-400 mt-4">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-500 underline">
          Đăng ký ngay
        </Link>
      </div>
    </form>
  );
};
