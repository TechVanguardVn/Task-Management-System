import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

/**
 * Form xử lý đăng ký tài khoản mới.
 */
export const RegisterForm: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation phía client
    if (fullName.trim().length < 2) {
      setErrorMessage('Họ và tên phải có ít nhất 2 ký tự');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Địa chỉ email không đúng định dạng');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có độ dài tối thiểu 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    try {
      setIsLoading(true);
      await register({ fullName, email, password });
      navigate('/login?registered=true');
    } catch (err: unknown) {
      const serverMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại sau.';
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
        label="Họ và tên"
        type="text"
        placeholder="Nguyễn Văn A"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        autoFocus
      />

      <Input
        label="Địa chỉ Email"
        type="email"
        placeholder="ten@congty.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Mật khẩu"
        type="password"
        placeholder="Tối thiểu 6 ký tự"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Input
        label="Xác nhận mật khẩu"
        type="password"
        placeholder="Nhập lại mật khẩu"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <Button type="submit" variant="primary" size="md" isLoading={isLoading} className="w-full">
        Tạo tài khoản
      </Button>

      <div className="text-center text-xs text-gray-500 dark:text-zinc-400 mt-4">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 underline">
          Đăng nhập
        </Link>
      </div>
    </form>
  );
};
