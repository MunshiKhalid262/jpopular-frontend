import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { UserForm } from "@/features/users/components/UserForm";

export const metadata: Metadata = {
  title: "Add user · JPopular",
};

export default async function NewUserPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  if (!hasPermission(currentUser.permissions, PERMISSIONS.usersManage)) {
    return (
      <p className="rounded-xl border border-line bg-surface p-5 text-sm text-ink-muted">
        You do not have permission to create users.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/users" className="text-sm text-brand hover:text-brand-strong">
          ← Back to users
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">Add user</h1>
        <p className="mt-1 text-sm text-ink-muted">
          The new user can sign in immediately with the password you set.
        </p>
      </header>

      <div className="rounded-xl border border-line bg-surface p-6">
        <UserForm mode="create" />
      </div>
    </div>
  );
}
