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
import type { NonGstRow, NonGstSummary } from "@/features/reporting/types";
import { formatInr } from "@/lib/money";

export const metadata: Metadata = { title: "Non-GST sales report" };

const KEYS = ["date_from", "date_to", "customer_id", "payment_status", "status"] as const;
const PATH = "/reports/non-gst";

export default async function NonGstReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!canViewReport(user.permissions, PERMISSIONS.reportsSales)) {
    return (
      <PermissionNotice>You do not have permission to view the non-GST report.</PermissionNotice>
    );
  }

  const { rows, summary, meta, period, error } = await fetchReport<NonGstRow, NonGstSummary>(
    PATH,
    reportQuery(params, KEYS),
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Non-GST sales report"
        description={
          period
            ? `Bills raised without GST, from ${period.from} to ${period.to}. No tax columns, because no tax was charged.`
            : "Bills raised without GST."
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
                { label: "Grand total", value: formatInr(summary.grand_total), emphasis: true },
                { label: "Paid", value: formatInr(summary.paid) },
                { label: "Balance", value: formatInr(summary.balance) },
              ]}
            />
          ) : null}

          <TableContainer>
            <Table minWidth="60rem">
              <THead>
                <TH>Date</TH>
                <TH>Invoice</TH>
                <TH>Customer</TH>
                <TH align="right">Subtotal</TH>
                <TH align="right">Discount</TH>
                <TH align="right">Grand total</TH>
                <TH align="right">Paid</TH>
                <TH align="right">Balance</TH>
                <TH>Status</TH>
              </THead>

              <TBody>
                {rows.length === 0 ? (
                  <TableEmptyRow colSpan={9}>
                    <EmptyState
                      icon={<FileText />}
                      title="No non-GST invoices in this period"
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
                      <TD align="right" numeric>
                        {formatInr(row.subtotal)}
                      </TD>
                      <TD align="right" numeric>
                        {formatInr(row.discount_amount)}
                      </TD>
                      <TD align="right" numeric className="font-medium text-fg">
                        {formatInr(row.grand_total)}
                      </TD>
                      <TD align="right" numeric>
                        {formatInr(row.paid_amount)}
                      </TD>
                      <TD align="right" numeric>
                        {formatInr(row.balance)}
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
