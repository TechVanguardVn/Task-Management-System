import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';
import type { LaravelValidationError, RegisterPayload } from '@/modules/auth/types/authType';

export const useRegisterForm = () => {
  const [formData, setFormData] = useState<RegisterPayload>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Xóa lỗi của trường đó khi người dùng bắt đầu nhập lại
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    setLoading(true);

    try {
      // Gọi action register từ Zustand (tự lấy CSRF cookie, register và cập nhật user)
      await register(formData);
      navigate('/'); // Chuyển thẳng vào dashboard
    } catch (err) {
      const error = err as AxiosError<LaravelValidationError>;
      if (error.response?.status === 422 && error.response?.data?.errors) {
        // Lỗi validate từng trường từ Laravel (Request)
        setErrors(error.response.data.errors);
      } else {
        setGeneralError(
          error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    errors,
    generalError,
    loading,
    handleChange,
    handleSubmit,
  };
};