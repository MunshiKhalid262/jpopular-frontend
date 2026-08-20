"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Field } from "@/components/ui/Field";
import { Button, FormAlert, Select, TextInput } from "@/components/ui/controls";
import { createUserSchema, updateUserSchema } from "@/features/auth/schemas";
import type { ManagedUser } from "@/features/auth/types";

type Mode = "create" | "edit";

type FieldErrors = Record<string, string>;

export function UserForm({ mode, user }: { mode: Mode; user?: ManagedUser }) {
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [role, setRole] = useState<"admin" | "manager">(
    (user?.roles[0] as "admin" | "manager" | undefined) ?? "manager",
  );

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const parsed =
      mode === "create"
        ? createUserSchema.safeParse({
            name,
            email,
            phone,
            password,
            password_confirmation: passwordConfirmation,
            role,
          })
        : updateUserSchema.safeParse({ name, email, phone });

    if (!parsed.success) {
      const next: FieldErrors = {};

      for (const issue of parsed.error.issues) {
        const key = issue.path.map(String).join(".");
        next[key] ??= issue.message;
      }

      setErrors(next);

      return;
    }

    setIsPending(true);

    try {
      const created = mode === "create";

      const response = await fetch(
        created ? "/api/v1/users" : `/api/v1/users/${user?.id}`,
        {
          method: created ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            created
              ? {
                  name,
                  email,
                  phone: phone === "" ? null : phone,
                  password,
                  password_confirmation: passwordConfirmation,
                  roles: [role],
                }
              : { name, email, phone: phone === "" ? null : phone },
          ),
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string; errors?: Record<string, string[]> }
          | null;

        if (response.status === 422 && body?.errors) {
          const next: FieldErrors = {};

          for (const [field, messages] of Object.entries(body.errors)) {
            if (messages[0]) {
              // Laravel reports `roles.0`; the form field is `role`.
              next[field === "roles.0" || field === "roles" ? "role" : field] = messages[0];
            }
          }

          setErrors(next);
        }

        setFormError(body?.message ?? "Could not save this user.");

        return;
      }

      // Role changes on an existing user go through a dedicated endpoint,
      // because they carry the last-active-admin guard.
      if (mode === "edit" && user && role !== user.roles[0]) {
        const roleResponse = await fetch(`/api/v1/users/${user.id}/roles`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roles: [role] }),
        });

        if (!roleResponse.ok) {
          const body = (await roleResponse.json().catch(() => null)) as
            | { message?: string }
            | null;

          setFormError(body?.message ?? "The user was saved, but the role could not be changed.");

          return;
        }
      }

      router.push("/users");
      router.refresh();
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5" noValidate>
      {formError ? <FormAlert message={formError} /> : null}

      <Field label="Full name" error={errors.name}>
        {(props) => (
          <TextInput
            {...props}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            disabled={isPending}
          />
        )}
      </Field>

      <Field label="Email" error={errors.email}>
        {(props) => (
          <TextInput
            {...props}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            disabled={isPending}
          />
        )}
      </Field>

      <Field label="Phone" error={errors.phone} hint="Optional.">
        {(props) => (
          <TextInput
            {...props}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            disabled={isPending}
          />
        )}
      </Field>

      <Field label="Role" error={errors.role}>
        {(props) => (
          <Select
            {...props}
            value={role}
            onChange={(event) => setRole(event.target.value as "admin" | "manager")}
            disabled={isPending}
          >
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </Select>
        )}
      </Field>

      {mode === "create" ? (
        <>
          <Field
            label="Password"
            error={errors.password}
            hint="At least 12 characters, including a letter and a number."
          >
            {(props) => (
              <TextInput
                {...props}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
                disabled={isPending}
              />
            )}
          </Field>

          <Field label="Confirm password" error={errors.password_confirmation}>
            {(props) => (
              <TextInput
                {...props}
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                autoComplete="new-password"
                required
                disabled={isPending}
              />
            )}
          </Field>
        </>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : mode === "create" ? "Create user" : "Save changes"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/users")}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
