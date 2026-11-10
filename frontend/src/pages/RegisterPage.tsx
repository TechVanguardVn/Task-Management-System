import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { AuthLayout } from "../components/auth/AuthLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { PasswordInput } from "../components/ui/PasswordInput";
import { useAuth } from "../context/AuthContext";
import { normalizeApiError } from "../lib/api-errors";
import type { AuthFieldErrors } from "../lib/api-errors";
import type { UserRegister } from "../types/auth";

const EMPTY_FORM: UserRegister = {
  full_name: "",
  email: "",
  password: "",
};

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<UserRegister>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(
    field: "full_name" | "email" | "password",
    value: string,
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fullName = form.full_name.trim();
    const nextErrors: AuthFieldErrors = {};

    if (!fullName) {
      nextErrors.full_name = "Enter your full name.";
    } else if (fullName.length > 100) {
      nextErrors.full_name = "Keep your name to 100 characters or fewer.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Enter your email address.";
    }

    if (form.password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    } else if (form.password.length > 128) {
      nextErrors.password = "Keep your password to 128 characters or fewer.";
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
      await register({
        full_name: fullName,
        email: form.email.trim(),
        password: form.password,
      });

      navigate("/login", {
        replace: true,
        state: { registered: true },
      });
    } catch (error) {
      const apiError = normalizeApiError(error);

      if (apiError.status === 409) {
        setFieldErrors({ email: "This email is already registered." });
      } else {
        setFieldErrors(apiError.fieldErrors);
      }

      setFormError(apiError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Create your workspace"
      description="One account keeps your task list private. Sign in after registering to open the workspace."
    >
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
          label="Full name"
          name="full_name"
          autoComplete="name"
          value={form.full_name}
          onChange={(event) => updateField("full_name", event.target.value)}
          error={fieldErrors.full_name}
          placeholder="Nguyen Van A"
        />
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
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          error={fieldErrors.password}
          hint="At least 8 characters, up to 128."
          placeholder="Create a password"
        />

        <Button
          type="submit"
          className="mt-1 w-full"
          isLoading={isSubmitting}
        >
          Create account
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-sm text-muted">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-accent underline decoration-orange-200 underline-offset-4 transition-colors hover:text-accent-hover hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
