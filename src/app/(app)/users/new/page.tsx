import type { Metadata } from "next";

import { PermissionNotice } from "@/components/ui/feedback";
import { BackLink, PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { UserForm } from "@/features/users/components/UserForm";

export const metadata: Metadata = { title: "Add user" };

export default async function NewUserPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.usersManage)) {
    return <PermissionNotice>You do not have permission to create users.</PermissionNotice>;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <BackLink href="/users">Back to users</BackLink>

      <PageHeader
        title="Add user"
        description="The new user can sign in immediately with the password you set."
      />

      <UserForm mode="create" />
    </div>
  );
}
