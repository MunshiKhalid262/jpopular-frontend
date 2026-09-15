import { FileText } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, ErrorNotice, PermissionNotice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import {
  CodeText,
  Pagination,
  TBody,
  TD,
  TDPrimary,
  TH,
  THead,
  TR,
  Table,
  TableContainer,
  TableEmptyRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS } from "@/features/auth/permissions";
import { ReportFilters } from "@/features/reporting/components/ReportFilters";
import { SummaryCards } from "@/features/reporting/components/SummaryCards";
import {
  canExport,
  canViewReport,
  exportHref,
  fetchReport,
  pageHref,
  reportQuery,
} from "@/features/reporting/report-page";
import type { SalesRow, SalesSummary } from "@/features/reporting/types";
import { formatInr } from "@/lib/money";

export const metadata: Metadata = { title: "Sales report" };

const KEYS = ["date_from", "date_to", "tax_type", "status", "customer_id", "payment_status"] as const;
const PATH = "/reports/sales";

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!canViewReport(user.permissions, PERMISSIONS.reportsSales)) {
    return <PermissionNotice>You do not have permission to view the sales report.</PermissionNotice>;
  }

  const { rows, summary, meta, period, error } = await fetchReport<SalesRow, SalesSummary>(
    PATH,
    reportQuery(params, KEYS),
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Sales report"
        description={
          period
            ? `Finalized invoices from ${period.from} to ${period.to}. Cancelled invoices are excluded unless you filter for them.`
            : "Finalized invoices for the selected period."
        }
        action={
          <ButtonLink href="/reports" variant="ghost">
            All reports
          </ButtonLink>
        }
      />

      <ReportFilters
        action={PATH}
        exportHref={exportHref(PATH, params, KEYS)}
        canExport={canExport(user.permissions)}
        values={params}
        selects={[
          {
            name: "tax_type",
            label: "Invoice type",
            value: params.tax_type,
            placeholder: "Any type",
            options: [
              { value: "gst", label: "GST" },
              { value: "non_gst", label: "Non-GST" },
            ],
          },
          {
            name: "status",
            label: "Invoice status",
            value: params.status,
            placeholder: "Finalized only",
            options: [
              { value: "finalized", label: "Finalized" },
              { value: "cancelled", label: "Cancelled" },
              { value: "draft", label: "Draft" },
            ],
          },
          {
            name: "payment_status",
            label: "Payment status",
            value: params.payment_status,
            placeholder: "Any payment status",
            options: [
              { value: "unpaid", label: "Unpaid" },
              { value: "partially_paid", label: "Part paid" },
              { value: "paid", label: "Paid" },
            ],
          },
        ]}
      />

      {error ? (
        <ErrorNotice>{error}</ErrorNotice>
      ) : (
        <>
          {summary ? (
            <SummaryCards
              items={[
                { label: "Invoices", value: String(summary.invoice_count) },
                { label: "Subtotal", value: formatInr(summary.subtotal) },
                { label: "Discount", value: formatInr(summary.discount) },
                { label: "Tax", value: formatInr(summary.tax) },
                { label: "Grand total", value: formatInr(summary.grand_total), emphasis: true },
                { label: "Outstanding", value: formatInr(summary.outstanding) },
              ]}
            />
          ) : null}

          <TableContainer>
            <Table minWidth="72rem">
              <THead>
                <TH>Date</TH>
                <TH>Invoice</TH>
                <TH>Customer</TH>
                <TH>Type</TH>
                <TH align="right">Taxable</TH>
                <TH align="right">Tax</TH>
                <TH align="right">Discount</TH>
                <TH align="right">Total</TH>
                <TH>Payment</TH>
              </THead>

              <TBody>
                {rows.length === 0 ? (
                  <TableEmptyRow colSpan={9}>
                    <EmptyState
                      icon={<FileText />}
                      title="No invoices in this period"
                      description="Try a wider date range, or clear the filters."
                      action={
                        <ButtonLink href={PATH} variant="secondary" size="sm">
                          Clear filters
                        </ButtonLink>
                      }
                    />
                  </TableEmptyRow>
                ) : (
                  rows.map((row) => (
                    <TR key={row.id}>
                      <TD className="whitespace-nowrap text-fg-muted">{row.invoice_date ?? "—"}</TD>
                      <TDPrimary href={`/invoices/${row.id}`}>
                        <CodeText>{row.invoice_number ?? `#${row.id}`}</CodeText>
                      </TDPrimary>
                      <TD className="max-w-[12rem] truncate whitespace-nowrap">
                        {row.customer_name ?? "Walk-in"}
                      </TD>
                      <TD>
                        <Badge tone={row.tax_type === "gst" ? "info" : "neutral"} size="sm">
                          {row.tax_type === "gst" ? "GST" : "Non-GST"}
                        </Badge>
                      </TD>
                      {/* Dash, not zero: a non-GST bill has no taxable value,
                          and a zero would imply one. */}
                      <TD align="right" numeric>
                        {row.taxable_amount === null ? (
                          <span className="text-fg-subtle">—</span>
                        ) : (
                          formatInr(row.taxable_amount)
                        )}
                      </TD>
                      <TD align="right" numeric>
                        {formatInr(row.total_tax)}
                      </TD>
                      <TD align="right" numeric>
                        {formatInr(row.discount_amount)}
                      </TD>
                      <TD align="right" numeric className="font-medium text-fg">
                        {formatInr(row.grand_total)}
                      </TD>
                      <TD>
                        <Badge
                          tone={
                            row.status === "cancelled"
                              ? "danger"
                              : row.payment_status === "paid"
                                ? "success"
                                : row.payment_status === "partially_paid"
                                  ? "warning"
                                  : "neutral"
                          }
                          size="sm"
                        >
                          {row.status === "cancelled"
                            ? "Cancelled"
                            : row.payment_status === "paid"
                              ? "Paid"
                              : row.payment_status === "partially_paid"
                                ? "Part paid"
                                : "Unpaid"}
                        </Badge>
                      </TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>

            {meta && rows.length > 0 ? (
              <Pagination
                currentPage={meta.current_page}
                lastPage={meta.last_page}
                total={meta.total}
                perPage={meta.per_page}
                buildHref={pageHref(PATH, params, KEYS)}
                label="invoices"
              />
            ) : null}
          </TableContainer>
        </>
      )}
    </div>
  );
}
