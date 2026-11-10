import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router";

import { AuthLayout } from "../components/auth/AuthLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { normalizeApiError } from "../lib/api-errors";
import type { AuthFieldErrors } from "../lib/api-errors";
import type { UserLogin } from "../types/auth";

interface LoginPageState {
  registered?: unknown;
}

const EMPTY_FORM: UserLogin = {
  email: "",
  password: "",
};

export function LoginPage() {
  const { login, sessionExpired } = useAuth();
  const location = useLocation();
  const state = location.state as LoginPageState | null;
  const registered = state?.registered === true;

  const [form, setForm] = useState<UserLogin>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: "email" | "password", value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: AuthFieldErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Enter your email address.";
    }

    if (!form.password) {
      nextErrors.password = "Enter your password.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError("Check the fields below and try again.");
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });
    } catch (error) {
      const apiError = normalizeApiError(error);
      setFieldErrors(apiError.fieldErrors);
      setFormError(apiError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Return to your workspace"
      description="Use the email you registered with. Your session stays on this device until the token expires or you sign out."
    >
      {sessionExpired ? (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm leading-5 text-amber-900"
        >
          Your session expired. Sign in again to continue where you left off.
        </div>
      ) : null}

      {registered ? (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm leading-5 text-emerald-900"
        >
          Account created. Sign in with your new credentials.
        </div>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm leading-5 text-red-700"
        >
          {formError}
        </div>
      ) : null}

      <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          error={fieldErrors.email}
          placeholder="you@example.com"
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          error={fieldErrors.password}
          placeholder="Your password"
        />

        <Button
          type="submit"
          className="mt-1 w-full"
          isLoading={isSubmitting}
        >
          Sign in
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-sm text-muted">
        New to Fieldnote?{" "}
        <Link
          to="/register"
          className="font-medium text-accent underline decoration-orange-200 underline-offset-4 transition-colors hover:text-accent-hover hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
