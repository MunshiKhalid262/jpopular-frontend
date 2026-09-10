"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldSpan, FormActions, FormSection } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/feedback";
import { Input, PasswordInput, Select } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { userFormSchema, type UserFormInput } from "@/features/auth/schemas";
import type { ManagedUser } from "@/features/auth/types";
import { postJson, putJson } from "@/features/catalog/client";

type Mode = "create" | "edit";

/**
 * Create/edit form for a staff account.
 *
 * On edit the role goes through the dedicated /users/{id}/roles endpoint rather
 * than the general update, because that endpoint carries the
 * last-active-admin guard. Both requests are reported honestly: if the details
 * save but the role change is refused, the message says exactly that rather
 * than implying nothing happened.
 */
export function UserForm({ mode, user }: { mode: Mode; user?: ManagedUser }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const isCreate = mode === "create";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormInput>({
    resolver: zodResolver(userFormSchema(mode)),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      role: (user?.roles[0] as "admin" | "manager" | undefined) ?? "manager",
      password: "",
      password_confirmation: "",
    },
  });

  function applyServerErrors(serverErrors: Record<string, string[]>) {
    const known: (keyof UserFormInput)[] = [
      "name",
      "email",
      "phone",
      "role",
      "password",
      "password_confirmation",
    ];

    for (const [field, messages] of Object.entries(serverErrors)) {
      const message = messages[0];

      if (!message) continue;

      // Laravel reports the role as `roles.0`; the form field is `role`.
      const key = field === "roles.0" || field === "roles" ? "role" : field;

      if (known.includes(key as keyof UserFormInput)) {
        setError(key as keyof UserFormInput, { message });
      }
    }
  }

  async function onSubmit(values: UserFormInput) {
    setFormError(null);

    if (isCreate) {
      const result = await postJson("/users", {
        name: values.name,
        email: values.email,
        phone: values.phone === "" ? null : values.phone,
        password: values.password,
        password_confirmation: values.password_confirmation,
        roles: [values.role],
      });

      if (!result.ok) {
        applyServerErrors(result.failure.errors);
        setFormError(result.failure.message);

        return;
      }

      notify.success("User created", {
        description: `${values.name} can sign in as ${values.role}.`,
      });

      router.push("/users");
      router.refresh();

      return;
    }

    if (!user) return;

    const detailsResult = await putJson(`/users/${user.id}`, {
      name: values.name,
      email: values.email,
      phone: values.phone === "" ? null : values.phone,
    });

    if (!detailsResult.ok) {
      applyServerErrors(detailsResult.failure.errors);
      setFormError(detailsResult.failure.message);

      return;
    }

    if (values.role !== user.roles[0]) {
      const roleResult = await putJson(`/users/${user.id}/roles`, { roles: [values.role] });

      if (!roleResult.ok) {
        // Be precise: the details DID save; only the role change failed.
        setFormError(
          `Details were saved, but the role could not be changed: ${roleResult.failure.message}`,
        );
        notify.warning("Role not changed", { description: roleResult.failure.message });
        router.refresh();

        return;
      }
    }

    notify.success("User updated", { description: values.name });

    router.push("/users");
    router.refresh();
  }

  return (
    <Card className="overflow-hidden">
      <form onSubmit={handleSubmit(onSubmit)} className="px-6 pt-6" noValidate>
        {formError ? (
          <div className="mb-5">
            <FormAlert message={formError} />
          </div>
        ) : null}

        <FormSection
          title="Account details"
          description="How this person is identified and contacted."
        >
          <Field label="Full name" error={errors.name?.message} required>
            {(props) => (
              <Input
                {...props}
                {...register("name")}
                autoComplete="name"
                placeholder="e.g. Priya Sharma"
                disabled={isSubmitting}
                autoFocus
              />
            )}
          </Field>

          <Field label="Email address" error={errors.email?.message} required>
            {(props) => (
              <Input
                {...props}
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="name@jpopular.in"
                disabled={isSubmitting}
              />
            )}
          </Field>

          <Field label="Phone" error={errors.phone?.message} hint="Optional.">
            {(props) => (
              <Input
                {...props}
                {...register("phone")}
                autoComplete="tel"
                inputMode="tel"
                placeholder="e.g. 9876543210"
                disabled={isSubmitting}
              />
            )}
          </Field>
        </FormSection>

        <FormSection
          title="Role"
          description="Roles are collections of permissions. Managers cannot reach user administration or settings."
        >
          <Field label="Role" error={errors.role?.message} required>
            {(props) => (
              <Select {...props} {...register("role")} disabled={isSubmitting}>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </Select>
            )}
          </Field>

          <FieldSpan>
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-muted px-3.5 py-3">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
              <p className="text-xs leading-relaxed text-fg-muted">
                The last active administrator cannot be demoted or deactivated.
                Grant Admin to another active user first.
              </p>
            </div>
          </FieldSpan>
        </FormSection>

        {isCreate ? (
          <FormSection
            title="Password"
            description="The user signs in with this immediately and can change it later."
          >
            <Field
              label="Password"
              error={errors.password?.message}
              hint="At least 12 characters, with a letter and a number."
              required
            >
              {(props) => (
                <PasswordInput
                  {...props}
                  {...register("password")}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              )}
            </Field>

            <Field
              label="Confirm password"
              error={errors.password_confirmation?.message}
              required
            >
              {(props) => (
                <PasswordInput
                  {...props}
                  {...register("password_confirmation")}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              )}
            </Field>
          </FormSection>
        ) : (
          <FormSection
            title="Password"
            description="Passwords are never shown and can only be replaced."
          >
            <FieldSpan>
              <p className="text-xs leading-relaxed text-fg-muted">
                Ask the user to sign in and change their own password. Changing a
                password ends that user&apos;s other sessions.
              </p>
            </FieldSpan>
          </FormSection>
        )}

        <FormActions>
          <Button variant="secondary" onClick={() => router.push("/users")} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {isCreate ? "Create user" : "Save changes"}
          </Button>
        </FormActions>
      </form>
    </Card>
  );
}
