import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';
import type { LaravelValidationError } from '@/modules/auth/types/authType';

export const useLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      const error = err as AxiosError<LaravelValidationError>;
      setErrorMsg(
        error.response?.data?.message || 'Email hoặc mật khẩu không chính xác.'
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    password,
    errorMsg,
    loading,
    setEmail,
    setPassword,
    handleSubmit,
  };
};