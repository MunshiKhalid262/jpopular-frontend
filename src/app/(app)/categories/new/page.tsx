import type { Metadata } from "next";

import { PermissionNotice } from "@/components/ui/feedback";
import { BackLink, PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { CategoryForm } from "@/features/catalog/components/CategoryForm";

export const metadata: Metadata = { title: "Add category" };

export default async function NewCategoryPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.categoriesManage)) {
    return <PermissionNotice>You do not have permission to create categories.</PermissionNotice>;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <BackLink href="/categories">Back to categories</BackLink>

      <PageHeader
        title="Add category"
        description="A slug is generated from the name automatically."
      />

      <CategoryForm />
    </div>
  );
}
