import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ErrorNotice, PermissionNotice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { BackLink } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import type { Product } from "@/features/catalog/types";
import { InvoiceForm } from "@/features/invoicing/components/InvoiceForm";
import type { BusinessSettings, Customer, Invoice } from "@/features/invoicing/types";
import { ApiError } from "@/lib/api-error";
import { loadBillingParties } from "@/features/invoicing/billing-parties";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Edit invoice" };

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.invoicesUpdate)) {
    return <PermissionNotice>You do not have permission to edit invoices.</PermissionNotice>;
  }

  let invoice: Invoice;
  let products: Product[] = [];
  let customers: Customer[] = [];
  let settings: BusinessSettings | null = null;

  try {
    const [invoiceResponse, productResponse, billingParties, settingsResponse] =
      await Promise.all([
        apiFetch<Invoice>(`/invoices/${id}`),
        apiFetch<Product[]>("/products?per_page=100&is_active=1"),
        loadBillingParties(),
        apiFetch<BusinessSettings>("/settings/business"),
      ]);

    invoice = invoiceResponse.data;
    products = productResponse.data;
    customers = billingParties;
    settings = settingsResponse.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <ErrorNotice>
        {error instanceof ApiError ? error.message : "Could not load this invoice."}
      </ErrorNotice>
    );
  }

  // Only a draft is editable. A finalized invoice is a legal document with a
  // number allocated and stock deducted; the API refuses the write regardless,
  // so saying so here is clearer than letting the save fail.
  if (invoice.status !== "draft") {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Edit invoice" />
        <ErrorNotice>
          This invoice has been {invoice.status === "cancelled" ? "cancelled" : "finalized"} and
          can no longer be edited. Cancel it and raise a new one if it was wrong.
        </ErrorNotice>
        <div>
          <BackLink href={`/invoices/${invoice.id}`}>Back to the invoice</BackLink>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={`Edit draft #${invoice.id}`}
        description="Still a draft: no number has been allocated and no stock has moved."
      />

      <InvoiceForm
        invoice={invoice}
        products={products}
        customers={customers}
        canIssueGst={settings?.can_issue_gst_invoices ?? false}
      />
    </div>
  );
}
