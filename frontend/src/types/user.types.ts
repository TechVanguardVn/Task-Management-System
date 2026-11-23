/**
 * Các kiểu dữ liệu liên quan đến người dùng và phiên xác thực.
 */
export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: UserProfile;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
