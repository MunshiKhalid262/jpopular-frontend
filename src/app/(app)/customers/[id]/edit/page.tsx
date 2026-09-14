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

export const metadata: Metadata = { title: "Edit customer" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.customersManage)) {
    return <PermissionNotice>You do not have permission to edit customers.</PermissionNotice>;
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
        {error instanceof ApiError ? error.message : "Could not load this customer."}
      </ErrorNotice>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={customer.name} description="Changes apply to future invoices only." />
      <CustomerForm customer={customer} />
    </div>
  );
}
