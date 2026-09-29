import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { AuthForm, type AuthValues } from "../components/AuthForm";
import { AuthPage } from "./Login";

export function Register() {
  const navigate = useNavigate();
  const submit = async (values: AuthValues) => {
    try {
      await register(values.fullName, values.email, values.password);
      navigate("/login", { state: { registered: true } });
    } catch (error) {
      throw new Error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Không thể tạo tài khoản"
          : "Không thể kết nối máy chủ",
      );
    }
  };
  return (
    <AuthPage
      title="Tạo tài khoản"
      subtitle="Bắt đầu sắp xếp công việc gọn gàng hơn"
    >
      <AuthForm mode="register" onSubmit={submit} />
      <p className="mt-6 text-center text-sm text-slate-600">
        Đã có tài khoản?{" "}
        <Link
          to="/login"
          className="font-semibold text-teal-700 hover:underline"
        >
          Đăng nhập
        </Link>
      </p>
    </AuthPage>
  );
}
