import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorNotice, PermissionNotice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { CodeText, TBody, TD, TH, THead, TR, Table, TableContainer } from "@/components/ui/table";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { InvoiceDocumentActions } from "@/features/invoicing/components/InvoiceDocumentActions";
import { InvoiceLifecycleActions } from "@/features/invoicing/components/InvoiceLifecycleActions";
import {
  InvoiceStatusBadge,
  TaxTypeBadge,
} from "@/features/invoicing/components/InvoiceStatusBadge";
import type { Invoice } from "@/features/invoicing/types";
import { ApiError } from "@/lib/api-error";
import { formatInr, formatPercent, formatQuantity } from "@/lib/money";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Invoice" };

function formatDate(value: string | null): string {
  if (!value) return "—";

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.invoicesView)) {
    return <PermissionNotice>You do not have permission to view invoices.</PermissionNotice>;
  }

  let invoice: Invoice;

  try {
    const response = await apiFetch<Invoice>(`/invoices/${id}`);
    invoice = response.data;
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

  const gst = invoice.tax_type === "gst";
  const interState = invoice.supply_type === "inter_state";
  const showHsn = gst && (invoice.items ?? []).some((item) => Boolean(item.hsn_code));

  const canPrint = hasPermission(user.permissions, PERMISSIONS.invoicesPrint);
  const canUpdate = hasPermission(user.permissions, PERMISSIONS.invoicesUpdate);
  const canFinalize = hasPermission(user.permissions, PERMISSIONS.invoicesFinalize);
  const canCancel = hasPermission(user.permissions, PERMISSIONS.invoicesCancel);
  const canDelete = hasPermission(user.permissions, PERMISSIONS.invoicesDelete);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={invoice.invoice_number ?? `Draft invoice #${invoice.id}`}
        description={
          invoice.status === "draft"
            ? "This draft has no number yet and has not affected stock. Finalizing issues it and deducts stock."
            : "A finalized invoice cannot be edited. Cancel it if it was raised in error."
        }
        action={
          <ButtonLink href="/invoices" variant="ghost">
            <ArrowLeft aria-hidden="true" />
            All invoices
          </ButtonLink>
        }
      />

      {/* Cancelled is stated before anything else: it changes how every figure
          below should be read. */}
      {invoice.status === "cancelled" ? (
        <div className="rounded-lg border border-danger-100 bg-danger-50 px-4 py-3">
          <p className="text-sm font-semibold text-danger-700">This invoice was cancelled</p>
          {invoice.cancellation_reason ? (
            <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-danger-700">
              {invoice.cancellation_reason}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-danger-700">
            It is kept for the record and can still be previewed or downloaded. Its number stays
            in the sequence.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <InvoiceStatusBadge status={invoice.status} />
          {/* Dealer is the exception worth flagging; a customer bill is the
              normal case and stays quiet. */}
          <Badge tone={invoice.invoice_type === "dealer" ? "primary" : "neutral"} size="sm">
            {invoice.invoice_type === "dealer" ? "Dealer" : "Customer"}
          </Badge>
          <TaxTypeBadge taxType={invoice.tax_type} />
          {gst && invoice.supply_type ? (
            <Badge tone="neutral" size="sm">
              {interState ? "Inter-state (IGST)" : "Intra-state (CGST + SGST)"}
            </Badge>
          ) : null}
          {invoice.prices_include_tax ? (
            <Badge tone="neutral" size="sm">
              Prices incl. GST
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* The document actions work for finalized AND cancelled invoices:
              a cancelled invoice is still a historical record. Drafts have no
              number yet, so they are not printable. */}
          {canPrint && invoice.status !== "draft" ? (
            <InvoiceDocumentActions
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoice_number}
            />
          ) : null}

          <InvoiceLifecycleActions
            invoice={invoice}
            canUpdate={canUpdate}
            canFinalize={canFinalize}
            canCancel={canCancel}
            canDelete={canDelete}
            canRecordPayment={hasPermission(user.permissions, PERMISSIONS.paymentsRecord)}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------ parties */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Billed to</p>
          {invoice.customer ? (
            <>
              <p className="mt-1 text-sm font-medium text-fg">{invoice.customer.name}</p>
              {invoice.customer.phone ? (
                <p className="text-[0.8125rem] text-fg-muted">{invoice.customer.phone}</p>
              ) : null}
              {gst && invoice.customer.gstin ? (
                <p className="mt-1 text-[0.8125rem] text-fg-muted">
                  GSTIN <CodeText>{invoice.customer.gstin}</CodeText>
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-1 text-sm text-fg-muted">Walk-in customer</p>
          )}
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Invoice date</p>
          <p className="mt-1 text-sm font-medium text-fg">{formatDate(invoice.invoice_date)}</p>
          {invoice.financial_year ? (
            <p className="text-[0.8125rem] text-fg-muted">FY {invoice.financial_year}</p>
          ) : null}
        </Card>

        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Balance due</p>
          <p className="num mt-1 text-lg font-semibold text-fg">
            {formatInr(invoice.due_amount)}
          </p>
          <p className="text-[0.8125rem] text-fg-muted">
            Paid {formatInr(invoice.paid_amount)} of {formatInr(invoice.grand_total)}
          </p>
        </Card>
      </div>

      {/* -------------------------------------------------------------- lines */}
      <TableContainer>
        <Table minWidth={gst ? "70rem" : "48rem"}>
          <THead>
            <TH>Item</TH>
            {showHsn ? <TH>HSN</TH> : null}
            <TH align="right">Qty</TH>
            <TH align="right">Rate</TH>
            {gst ? <TH align="right">Taxable</TH> : null}
            {gst ? <TH align="right">GST</TH> : null}
            <TH align="right">Amount</TH>
          </THead>

          <TBody>
            {(invoice.items ?? []).map((item) => (
              <TR key={item.id}>
                <TD>
                  {/* Snapshot values: these are what was charged, not what the
                      product says today. */}
                  <span className="font-medium text-fg">{item.product_name}</span>
                  <span className="ml-2 text-xs text-fg-subtle">{item.sku}</span>
                </TD>
                {showHsn ? <TD className="text-fg-muted">{item.hsn_code ?? "—"}</TD> : null}
                <TD align="right" numeric>
                  {formatQuantity(item.quantity)}
                  <span className="ml-1 text-xs text-fg-subtle">{item.unit}</span>
                </TD>
                <TD align="right" numeric>
                  {formatInr(item.unit_price)}
                </TD>
                {gst ? (
                  <TD align="right" numeric>
                    {formatInr(item.taxable_amount)}
                  </TD>
                ) : null}
                {gst ? (
                  <TD align="right" numeric>
                    {formatInr(item.tax_amount)}
                    <span className="ml-1 text-xs text-fg-subtle">
                      {formatPercent(item.gst_rate)}
                    </span>
                  </TD>
                ) : null}
                <TD align="right" numeric className="font-medium text-fg">
                  {formatInr(item.line_total)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </TableContainer>

      {/* --------------------------------------------- additional charges */}
      {(invoice.charges ?? []).length > 0 ? (
        <TableContainer>
          <Table minWidth="40rem">
            <THead>
              <TH>Additional charge</TH>
              <TH>SAC</TH>
              <TH align="right">Amount</TH>
              <TH align="right">GST</TH>
              <TH align="right">Total</TH>
            </THead>
            <TBody>
              {(invoice.charges ?? []).map((charge) => (
                <TR key={charge.id}>
                  <TD className="font-medium text-fg">{charge.description}</TD>
                  <TD className="text-fg-muted">{charge.hsn_code ?? "—"}</TD>
                  <TD align="right" numeric>
                    {formatInr(charge.taxable_amount)}
                  </TD>
                  <TD align="right" numeric>
                    {formatInr(charge.tax_amount)}
                    <span className="ml-1 text-xs text-fg-subtle">
                      {formatPercent(charge.gst_rate)}
                    </span>
                  </TD>
                  <TD align="right" numeric className="font-medium text-fg">
                    {formatInr(charge.total)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableContainer>
      ) : null}

      {/* ------------------------------------------- dealer transport block */}
      {invoice.invoice_type === "dealer" ? (
        <Card className="p-4">
          <p className="mb-2.5 text-xs font-medium uppercase tracking-wide text-fg-subtle">
            Transport &amp; dispatch
          </p>
          <dl className="grid gap-x-6 gap-y-2 text-[0.8125rem] sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["e-Way Bill No.", invoice.eway_bill_no],
              ["Motor Vehicle No.", invoice.vehicle_no],
              ["Dispatched through", invoice.dispatched_through],
              ["Destination", invoice.destination],
              ["LR-RR No.", invoice.lr_rr_no],
              ["Delivery Note", invoice.delivery_note],
              ["Buyer's Order No.", invoice.buyer_order_no],
              ["Terms of Delivery", invoice.terms_of_delivery],
              ["IRN", invoice.irn],
            ]
              .filter(([, value]) => Boolean(value))
              .map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-fg-subtle">{label}</dt>
                  <dd className="break-all font-medium text-fg">{value}</dd>
                </div>
              ))}
          </dl>

          {!invoice.eway_bill_no ? (
            <p className="mt-3 rounded-md border border-warning-100 bg-warning-50 px-3 py-2 text-xs leading-relaxed text-warning-700">
              No e-Way Bill number yet. Generate it on the government portal and add it here — the
              document prints its e-Way Bill page only once the number is present.
            </p>
          ) : null}

          {invoice.consignee_name ? (
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
                Consignee (Ship to)
              </p>
              <p className="mt-1 text-[0.8125rem] font-medium text-fg">{invoice.consignee_name}</p>
              {invoice.consignee_address ? (
                <p className="text-[0.8125rem] text-fg-muted">{invoice.consignee_address}</p>
              ) : null}
              {invoice.consignee_gstin ? (
                <p className="text-[0.8125rem] text-fg-muted">
                  GSTIN <CodeText>{invoice.consignee_gstin}</CodeText>
                </p>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* ------------------------------------------------------------- totals */}
      <div className="flex justify-end">
        <Card className="w-full max-w-sm p-4">
          <dl className="flex flex-col gap-1.5 text-[0.8125rem]">
            <Row label="Subtotal" value={formatInr(invoice.subtotal)} />

            {invoice.discount_amount !== "0.00" ? (
              <Row label="Discount" value={`- ${formatInr(invoice.discount_amount)}`} />
            ) : null}

            {/* Taxable value, CGST/SGST and IGST appear only on a GST invoice:
                on a non-GST bill they would imply a tax that is not charged. */}
            {gst ? <Row label="Taxable value" value={formatInr(invoice.taxable_amount)} /> : null}

            {gst && !interState ? (
              <>
                <Row label="CGST" value={formatInr(invoice.cgst_amount)} />
                <Row label="SGST" value={formatInr(invoice.sgst_amount)} />
              </>
            ) : null}

            {gst && interState ? <Row label="IGST" value={formatInr(invoice.igst_amount)} /> : null}

            {invoice.round_off !== "0.00" ? (
              <Row label="Round off" value={formatInr(invoice.round_off)} />
            ) : null}

            <div className="mt-1.5 flex items-center justify-between border-t border-border pt-2">
              <dt className="text-sm font-semibold text-fg">Grand total</dt>
              <dd className="num text-sm font-semibold text-fg">
                {formatInr(invoice.grand_total)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {invoice.notes ? (
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Notes</p>
          <p className="mt-1 whitespace-pre-line text-[0.8125rem] leading-relaxed text-fg-muted">
            {invoice.notes}
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="num text-fg">{value}</dd>
    </div>
  );
}
