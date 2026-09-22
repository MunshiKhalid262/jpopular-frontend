import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ErrorNotice, PermissionNotice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { CustomerForm } from "@/features/invoicing/components/CustomerForm";
import type { Customer } from "@/features/invoicing/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Edit dealer" };

export default async function EditDealerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.customersManage)) {
    return <PermissionNotice>You do not have permission to edit dealers.</PermissionNotice>;
  }

  let customer: Customer;

  try {
    customer = (await apiFetch<Customer>(`/customers/${id}`)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <ErrorNotice>
        {error instanceof ApiError ? error.message : "Could not load this dealer."}
      </ErrorNotice>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={customer.name}
        description="Changes apply to future invoices only — dispatch details already on an invoice stay as they were."
      />
      <CustomerForm customer={customer} defaultType="dealer" />
    </div>
  );
}
