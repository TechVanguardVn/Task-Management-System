import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, Eye, EyeOff, Layers, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { getFriendlyErrorMessage } from "../../../lib/api-client";
import { useLoginMutation, useRegisterMutation } from "../hooks/useAuth";
import {
  type LoginFormValues,
  loginFormSchema,
  type RegisterFormValues,
  registerFormSchema,
} from "../schemas/auth.schema";

interface AuthPageProps {
  mode: "login" | "register";
}

export function AuthPage({ mode }: AuthPageProps) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
    "/dashboard";

  const switchMode = (targetMode: "login" | "register") => {
    if (targetMode === mode) {
      return;
    }
    navigate(targetMode === "login" ? "/login" : "/register", {
      state: location.state,
    });
  };

  return (
    <main className="bento-canvas flex min-h-dvh items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[420px]">
        <section
          aria-labelledby="auth-heading"
          className="bento-card rounded-3xl p-7 sm:p-8"
        >
          {/* Header */}
          <div className="mb-5 flex flex-col items-start">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-slate-50 px-3 py-1 text-xs font-semibold tracking-wider text-slate-700 uppercase">
              <Layers className="h-3.5 w-3.5 text-zinc-900" aria-hidden="true" />
              <span>TaskFlow</span>
            </div>

            <h1
              id="auth-heading"
              className="font-heading text-2xl font-semibold text-zinc-900"
            >
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
          </div>

          {/* Segmented Pill Control */}
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="mb-5 grid grid-cols-2 rounded-2xl border border-slate-200/80 bg-slate-100/90 p-1.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              onClick={() => switchMode("login")}
              className={`min-h-[40px] cursor-pointer rounded-xl text-sm transition-all focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none ${
                isLogin
                  ? "bg-white font-semibold text-zinc-900 shadow-xs"
                  : "font-medium text-slate-600 hover:text-zinc-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              onClick={() => switchMode("register")}
              className={`min-h-[40px] cursor-pointer rounded-xl text-sm transition-all focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none ${
                !isLogin
                  ? "bg-white font-semibold text-zinc-900 shadow-xs"
                  : "font-medium text-slate-600 hover:text-zinc-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Active Form */}
          {isLogin ? (
            <LoginForm onSuccess={() => navigate(redirectTarget, { replace: true })} />
          ) : (
            <RegisterForm onSuccess={() => navigate(redirectTarget, { replace: true })} />
          )}
        </section>
      </div>
    </main>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values);
      onSuccess();
    } catch {
      // Handled via loginMutation.error
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-xs font-semibold text-slate-700"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className={`h-[44px] w-full rounded-xl border px-3.5 text-sm text-zinc-900 transition-colors placeholder:text-slate-400 focus:bg-white focus:ring-3 focus:outline-none ${
            errors.email
              ? "border-red-300 bg-red-50/40 focus:border-red-600 focus:ring-red-600/10"
              : "border-slate-200 bg-slate-50/80 focus:border-zinc-900 focus:ring-zinc-900/10"
          }`}
          {...register("email")}
        />
        {errors.email && (
          <p
            id="login-email-error"
            role="alert"
            className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{errors.email.message}</span>
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="login-password"
          className="mb-1.5 block text-xs font-semibold text-slate-700"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            className={`h-[44px] w-full rounded-xl border pr-11 pl-3.5 text-sm text-zinc-900 transition-colors placeholder:text-slate-400 focus:bg-white focus:ring-3 focus:outline-none ${
              errors.password
                ? "border-red-300 bg-red-50/40 focus:border-red-600 focus:ring-red-600/10"
                : "border-slate-200 bg-slate-50/80 focus:border-zinc-900 focus:ring-zinc-900/10"
            }`}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p
            id="login-password-error"
            role="alert"
            className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{errors.password.message}</span>
          </p>
        )}
      </div>

      {loginMutation.isError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs leading-relaxed font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <span>{getFriendlyErrorMessage(loginMutation.error)}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold whitespace-nowrap text-white shadow-xs transition-all hover:bg-zinc-800 active:scale-[0.99] focus-visible:ring-3 focus-visible:ring-zinc-900/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loginMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const registerMutation = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync(values);
      onSuccess();
    } catch {
      // Handled via registerMutation.error
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <label
          htmlFor="register-name"
          className="mb-1.5 block text-xs font-semibold text-slate-700"
        >
          Full Name
        </label>
        <input
          id="register-name"
          type="text"
          autoComplete="name"
          placeholder="Alex Morgan"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "register-name-error" : undefined}
          className={`h-[44px] w-full rounded-xl border px-3.5 text-sm text-zinc-900 transition-colors placeholder:text-slate-400 focus:bg-white focus:ring-3 focus:outline-none ${
            errors.name
              ? "border-red-300 bg-red-50/40 focus:border-red-600 focus:ring-red-600/10"
              : "border-slate-200 bg-slate-50/80 focus:border-zinc-900 focus:ring-zinc-900/10"
          }`}
          {...register("name")}
        />
        {errors.name && (
          <p
            id="register-name-error"
            role="alert"
            className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{errors.name.message}</span>
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="register-email"
          className="mb-1.5 block text-xs font-semibold text-slate-700"
        >
          Email
        </label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          className={`h-[44px] w-full rounded-xl border px-3.5 text-sm text-zinc-900 transition-colors placeholder:text-slate-400 focus:bg-white focus:ring-3 focus:outline-none ${
            errors.email
              ? "border-red-300 bg-red-50/40 focus:border-red-600 focus:ring-red-600/10"
              : "border-slate-200 bg-slate-50/80 focus:border-zinc-900 focus:ring-zinc-900/10"
          }`}
          {...register("email")}
        />
        {errors.email && (
          <p
            id="register-email-error"
            role="alert"
            className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{errors.email.message}</span>
          </p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="register-password"
            className="block text-xs font-semibold text-slate-700"
          >
            Password
          </label>
          <span id="register-password-hint" className="text-[11px] text-slate-400">
            Min. 8 chars
          </span>
        </div>
        <div className="relative">
          <input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "register-password-error" : "register-password-hint"
            }
            className={`h-[44px] w-full rounded-xl border pr-11 pl-3.5 text-sm text-zinc-900 transition-colors placeholder:text-slate-400 focus:bg-white focus:ring-3 focus:outline-none ${
              errors.password
                ? "border-red-300 bg-red-50/40 focus:border-red-600 focus:ring-red-600/10"
                : "border-slate-200 bg-slate-50/80 focus:border-zinc-900 focus:ring-zinc-900/10"
            }`}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p
            id="register-password-error"
            role="alert"
            className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{errors.password.message}</span>
          </p>
        )}
      </div>

      {registerMutation.isError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs leading-relaxed font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <span>{getFriendlyErrorMessage(registerMutation.error)}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={registerMutation.isPending}
        className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold whitespace-nowrap text-white shadow-xs transition-all hover:bg-zinc-800 active:scale-[0.99] focus-visible:ring-3 focus-visible:ring-zinc-900/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {registerMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Creating account...</span>
          </>
        ) : (
          <>
            <span>Create Account</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}
