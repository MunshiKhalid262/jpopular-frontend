"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/feedback";
import { Input, PasswordInput } from "@/components/ui/input";
import { loginSchema, type LoginInput } from "@/features/auth/schemas";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [isRedirecting, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const busy = isSubmitting || isRedirecting || redirecting;

  async function onSubmit(values: LoginInput) {
    setFormError(null);

    let response: Response;

    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");

      return;
    }

    const body = (await response.json().catch(() => null)) as
      | { message?: string; errors?: Record<string, string[]> }
      | null;

    if (!response.ok) {
      if (response.status === 422 && body?.errors) {
        let mapped = false;

        for (const field of ["email", "password"] as const) {
          const message = body.errors[field]?.[0];

          if (message) {
            setError(field, { message });
            mapped = true;
          }
        }

        // Laravel reports bad credentials, an inactive account and a
        // soft-deleted account identically under `email` -- by design, so the
        // endpoint cannot be used to discover which accounts exist.
        if (!mapped) {
          setFormError(body.message ?? "Please check your details and try again.");
        }

        return;
      }

      setFormError(body?.message ?? "Unable to sign in. Please try again.");

      return;
    }

    setRedirecting(true);

    startTransition(() => {
      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {formError ? <FormAlert message={formError} /> : null}

      <Field label="Email address" error={errors.email?.message} required>
        {(props) => (
          <Input
            {...props}
            {...register("email")}
            type="email"
            autoComplete="username"
            placeholder="you@jpopular.in"
            autoFocus
            disabled={busy}
            className="h-10"
          />
        )}
      </Field>

      <Field label="Password" error={errors.password?.message} required>
        {(props) => (
          <PasswordInput
            {...props}
            {...register("password")}
            autoComplete="current-password"
            placeholder="Enter your password"
            disabled={busy}
            className="h-10"
          />
        )}
      </Field>

      <Button type="submit" variant="primary" size="lg" loading={busy} className="mt-1 w-full">
        {busy ? "Signing in…" : "Sign in"}
        {busy ? null : <ArrowRight aria-hidden="true" />}
      </Button>
    </form>
  );
}
