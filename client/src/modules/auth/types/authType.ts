export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Format trả về từ AuthController (register / login)
export interface AuthResponse {
  user: User;
  access_token: string;
  token_type: string;
}

// Kiểu lỗi validation 422 từ Laravel
export interface LaravelValidationError {
  message: string;
  errors?: Record<string, string[]>;
}