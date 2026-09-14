import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/ui/button";
import { ErrorNotice, PermissionNotice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { InvoicePreviewFrame } from "@/features/invoicing/components/InvoicePreviewFrame";
import type { Invoice } from "@/features/invoicing/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Invoice preview" };

/**
 * Preview of exactly what will print and download.
 *
 * The document is rendered by the API and shown in an IFRAME rather than
 * re-implemented here. That is the point: one template, one set of
 * presentation rules, so the preview cannot drift from the PDF. It also means
 * printing prints the frame alone -- the sidebar, top bar and these buttons
 * are not part of the printed document at all, rather than being hidden by a
 * stylesheet that might miss something.
 */
export default async function InvoicePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.invoicesPrint)) {
    return (
      <PermissionNotice>You do not have permission to print or download invoices.</PermissionNotice>
    );
  }

  let invoice: Invoice;

  try {
    invoice = (await apiFetch<Invoice>(`/invoices/${id}`)).data;
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

  // A draft has no number and is not an issued document yet.
  if (invoice.status === "draft") {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Invoice preview"
          action={
            <ButtonLink href={`/invoices/${invoice.id}`} variant="ghost">
              <ArrowLeft aria-hidden="true" />
              Back to invoice
            </ButtonLink>
          }
        />
        <ErrorNotice>
          This invoice is still a draft, so it has no number yet. Finalize it to preview, print or
          download the document.
        </ErrorNotice>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={invoice.invoice_number ?? `Invoice #${invoice.id}`}
        description="Exactly what will be printed and downloaded. Nothing is stored — the document is generated each time it is requested."
        action={
          <ButtonLink href={`/invoices/${invoice.id}`} variant="ghost">
            <ArrowLeft aria-hidden="true" />
            Back to invoice
          </ButtonLink>
        }
      />

      <InvoicePreviewFrame
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoice_number}
        cancelled={invoice.status === "cancelled"}
      />
    </div>
  );
}
