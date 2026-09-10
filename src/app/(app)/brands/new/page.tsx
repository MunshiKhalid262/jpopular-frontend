import type { Metadata } from "next";

import { PermissionNotice } from "@/components/ui/feedback";
import { BackLink, PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { BrandForm } from "@/features/catalog/components/BrandForm";

export const metadata: Metadata = { title: "Add brand" };

export default async function NewBrandPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.brandsManage)) {
    return <PermissionNotice>You do not have permission to create brands.</PermissionNotice>;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <BackLink href="/brands">Back to brands</BackLink>

      <PageHeader title="Add brand" description="A slug is generated from the name automatically." />

      <BrandForm />
    </div>
  );
}
