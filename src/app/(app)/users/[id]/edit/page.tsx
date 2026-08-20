import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import type { ManagedUser } from "@/features/auth/types";
import { UserForm } from "@/features/users/components/UserForm";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Edit user · JPopular",
};

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  if (!hasPermission(currentUser.permissions, PERMISSIONS.usersManage)) {
    return (
      <p className="rounded-xl border border-line bg-surface p-5 text-sm text-ink-muted">
        You do not have permission to edit users.
      </p>
    );
  }

  let user: ManagedUser;

  try {
    const response = await apiFetch<ManagedUser>(`/users/${id}`);
    user = response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/users" className="text-sm text-brand hover:text-brand-strong">
          ← Back to users
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">{user.name}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Change details or role. Passwords are not shown and can only be replaced.
        </p>
      </header>

      <div className="rounded-xl border border-line bg-surface p-6">
        <UserForm mode="edit" user={user} />
      </div>
    </div>
  );
}
