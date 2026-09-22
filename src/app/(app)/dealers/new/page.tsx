import type { Metadata } from "next";

import { PermissionNotice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { CustomerForm } from "@/features/invoicing/components/CustomerForm";

export const metadata: Metadata = { title: "Add dealer" };

export default async function NewDealerPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.customersManage)) {
    return <PermissionNotice>You do not have permission to add dealers.</PermissionNotice>;
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Add dealer"
        description="Only the name is required. Anything you fill in under dispatch defaults is copied onto every dealer invoice you raise for them."
      />
      <CustomerForm defaultType="dealer" />
    </div>
  );
}
