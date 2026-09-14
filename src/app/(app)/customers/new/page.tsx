import type { Metadata } from "next";

import { PermissionNotice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { CustomerForm } from "@/features/invoicing/components/CustomerForm";

export const metadata: Metadata = { title: "Add customer" };

export default async function NewCustomerPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.customersManage)) {
    return <PermissionNotice>You do not have permission to add customers.</PermissionNotice>;
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Add customer" description="Only the name is required." />
      <CustomerForm />
    </div>
  );
}
