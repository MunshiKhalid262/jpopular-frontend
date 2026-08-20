"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Field } from "@/components/ui/Field";
import { Button, FormAlert, TextInput } from "@/components/ui/controls";
import { loginSchema } from "@/features/auth/schemas";

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const busy = isPending || isRedirecting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    // Client validation is UX; the server revalidates.
    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      const next: FieldErrors = {};

      for (const issue of parsed.error.issues) {
        const key = issue.path[0];

        if (key === "email" || key === "password") {
          next[key] ??= issue.message;
        }
      }

      setFieldErrors(next);

      return;
    }

    let response: Response;

    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");

      return;
    }

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const envelope = (body ?? {}) as {
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (response.status === 422 && envelope.errors) {
        const next: FieldErrors = {};

        if (envelope.errors.email?.[0]) next.email = envelope.errors.email[0];
        if (envelope.errors.password?.[0]) next.password = envelope.errors.password[0];

        // Laravel reports bad credentials, an inactive account, and a
        // soft-deleted account identically under `email` -- by design, so the
        // endpoint cannot be used to enumerate accounts.
        if (Object.keys(next).length > 0) {
          setFieldErrors(next);
        } else {
          setFormError(envelope.message ?? "Please check your details and try again.");
        }

        return;
      }

      setFormError(envelope.message ?? "Unable to sign in. Please try again.");

      return;
    }

    setIsRedirecting(true);

    startTransition(() => {
      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {formError ? <FormAlert message={formError} /> : null}

      <Field label="Email" error={fieldErrors.email}>
        {(props) => (
          <TextInput
            {...props}
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            autoFocus
            required
            disabled={busy}
            placeholder="you@jpopular.in"
          />
        )}
      </Field>

      <Field label="Password" error={fieldErrors.password}>
        {(props) => (
          <TextInput
            {...props}
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            disabled={busy}
          />
        )}
      </Field>

      <Button type="submit" disabled={busy} className="mt-1 w-full">
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
