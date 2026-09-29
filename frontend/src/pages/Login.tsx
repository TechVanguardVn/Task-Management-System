import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { AuthForm, type AuthValues } from "../components/AuthForm";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const submit = async (values: AuthValues) => {
    try {
      signIn(await login(values.email, values.password));
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (error) {
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Email hoặc mật khẩu không đúng"
          : "Không thể kết nối máy chủ",
      );
    }
  };
  return (
    <AuthPage
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để quản lý công việc của bạn"
    >
      <AuthForm mode="login" onSubmit={submit} />
      <p className="mt-6 text-center text-sm text-slate-600">
        Chưa có tài khoản?{" "}
        <Link
          to="/register"
          className="font-semibold text-teal-700 hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>
    </AuthPage>
  );
}

export function AuthPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-6 text-xl font-bold text-teal-800">TaskFlow</p>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">{subtitle}</p>
        {children}
      </section>
    </main>
  );
}
