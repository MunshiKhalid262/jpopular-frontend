import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RoleBadge, StatusBadge } from "@/components/ui/badge";
import { PermissionNotice } from "@/components/ui/feedback";
import { BackLink, PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import type { ManagedUser } from "@/features/auth/types";
import { UserForm } from "@/features/users/components/UserForm";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Edit user" };

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) return null;

  if (!hasPermission(currentUser.permissions, PERMISSIONS.usersManage)) {
    return <PermissionNotice>You do not have permission to edit users.</PermissionNotice>;
  }

  let user: ManagedUser;

  try {
    const response = await apiFetch<ManagedUser>(`/users/${id}`);
    user = response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const isSelf = user.id === currentUser.id;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <BackLink href="/users">Back to users</BackLink>

      <PageHeader
        title={user.name}
        description={
          isSelf
            ? "This is your own account. You cannot deactivate or demote yourself."
            : user.email
        }
        action={
          <div className="flex items-center gap-2">
            {user.roles.map((role) => (
              <RoleBadge key={role} role={role} />
            ))}
            <StatusBadge active={user.is_active} />
          </div>
        }
      />

      <UserForm mode="edit" user={user} />
    </div>
  );
}
