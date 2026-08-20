import type { Metadata } from "next";
import Link from "next/link";

import { UserStatusToggle } from "@/features/users/components/UserStatusToggle";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import type { ManagedUser } from "@/features/auth/types";
import { Badge } from "@/components/ui/controls";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = {
  title: "Users · JPopular",
};

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  // Defence in depth: the server would 403 anyway, but showing a clear message
  // beats rendering an empty table.
  if (!hasPermission(currentUser.permissions, PERMISSIONS.usersView)) {
    return (
      <p className="rounded-xl border border-line bg-surface p-5 text-sm text-ink-muted">
        You do not have permission to view users.
      </p>
    );
  }

  let users: ManagedUser[] = [];
  let loadError: string | null = null;

  try {
    const response = await apiFetch<ManagedUser[]>("/users?per_page=100");
    users = response.data;
  } catch (error) {
    loadError =
      error instanceof ApiError ? error.message : "Could not load users. Please try again.";
  }

  const canManage = hasPermission(currentUser.permissions, PERMISSIONS.usersManage);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Users</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Administrators and managers who can sign in to JPopular.
          </p>
        </div>

        {canManage ? (
          <Link
            href="/users/new"
            className="inline-flex items-center rounded-[--radius-control] bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
          >
            Add user
          </Link>
        ) : null}
      </header>

      {loadError ? (
        <p role="alert" className="rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
          {loadError}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-subtle">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Name</th>
                <th scope="col" className="px-4 py-3 font-semibold">Email</th>
                <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Last sign-in</th>
                {canManage ? <th scope="col" className="px-4 py-3 font-semibold">Actions</th> : null}
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-4 py-8 text-center text-ink-muted">
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === currentUser.id;

                  return (
                    <tr key={user.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-medium text-ink">
                        {user.name}
                        {isSelf ? (
                          <span className="ml-2 text-xs font-normal text-ink-subtle">(you)</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{user.email}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {user.roles.length > 0 ? user.roles.join(", ") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={user.is_active ? "success" : "danger"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-muted tabular-nums">
                        {formatDate(user.last_login_at)}
                      </td>

                      {canManage ? (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/users/${user.id}/edit`}
                              className="text-sm font-medium text-brand hover:text-brand-strong"
                            >
                              Edit
                            </Link>

                            <UserStatusToggle
                              userId={user.id}
                              isActive={user.is_active}
                              // The server enforces this too (409
                              // CANNOT_DEACTIVATE_SELF); disabling here just
                              // avoids offering an action that must fail.
                              disabledReason={isSelf ? "You cannot deactivate your own account." : null}
                            />
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
