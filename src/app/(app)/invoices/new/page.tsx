import type { Metadata } from "next";

import { ErrorNotice, PermissionNotice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import type { Product } from "@/features/catalog/types";
import { InvoiceForm } from "@/features/invoicing/components/InvoiceForm";
import type { BusinessSettings, Customer } from "@/features/invoicing/types";
import { ApiError } from "@/lib/api-error";
import { loadBillingParties } from "@/features/invoicing/billing-parties";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "New invoice" };

export default async function NewInvoicePage() {
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.invoicesCreate)) {
    return <PermissionNotice>You do not have permission to create invoices.</PermissionNotice>;
  }

  let products: Product[] = [];
  let customers: Customer[] = [];
  let settings: BusinessSettings | null = null;
  let loadError: string | null = null;

  try {
    const [productResponse, billingParties, settingsResponse] = await Promise.all([
      apiFetch<Product[]>("/products?per_page=100&is_active=1"),
      loadBillingParties(),
      apiFetch<BusinessSettings>("/settings/business"),
    ]);

    products = productResponse.data;
    customers = billingParties;
    settings = settingsResponse.data;
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : "Could not load the invoice form.";
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="New invoice"
        description="This creates a draft. Nothing is numbered and no stock moves until you finalize it."
      />

      {loadError ? (
        <ErrorNotice>{loadError}</ErrorNotice>
      ) : (
        <InvoiceForm
          products={products}
          customers={customers}
          canIssueGst={settings?.can_issue_gst_invoices ?? false}
        />
      )}
    </div>
  );
}
