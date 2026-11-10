export interface UserPublic {
  id: number;
  email: string;
  full_name: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserRegister {
  email: string;
  password: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserPublic;
}

export interface LogoutResponse {
  message: string;
}

export interface AuthState {
  user: UserPublic | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionError: string | null;
  sessionExpired: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: UserLogin) => Promise<UserPublic>;
  register: (payload: UserRegister) => Promise<UserPublic>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}
