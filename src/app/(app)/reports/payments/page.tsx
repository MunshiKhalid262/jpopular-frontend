import { Wallet } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import type { PaymentRow, PaymentSummary } from "@/features/reporting/types";
import { formatInr } from "@/lib/money";

export const metadata: Metadata = { title: "Payment report" };

const KEYS = ["date_from", "date_to", "payment_method", "customer_id"] as const;
const PATH = "/reports/payments";

function formatDateTime(value: string | null): string {
  if (!value) return "—";

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
}

export default async function PaymentReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!canViewReport(user.permissions, PERMISSIONS.reportsPayments)) {
    return (
      <PermissionNotice>You do not have permission to view the payment report.</PermissionNotice>
    );
  }

  const { rows, summary, meta, period, error } = await fetchReport<PaymentRow, PaymentSummary>(
    PATH,
    reportQuery(params, KEYS),
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Payment report"
        description={
          period
            ? `Money actually collected from ${period.from} to ${period.to}. Voided payments are excluded.`
            : "Money actually collected in the selected period."
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
            name: "payment_method",
            label: "Payment method",
            value: params.payment_method,
            placeholder: "Any method",
            options: [
              { value: "cash", label: "Cash" },
              { value: "upi", label: "UPI" },
              { value: "card", label: "Card" },
              { value: "bank_transfer", label: "Bank transfer" },
              { value: "cheque", label: "Cheque" },
              { value: "other", label: "Other" },
            ],
          },
        ]}
      />

      {error ? (
        <ErrorNotice>{error}</ErrorNotice>
      ) : (
        <>
          {summary ? (
            <>
              <SummaryCards
                items={[
                  { label: "Payments", value: String(summary.payment_count) },
                  {
                    label: "Total received",
                    value: formatInr(summary.total_received),
                    emphasis: true,
                  },
                ]}
              />

              {summary.by_method.length > 0 ? (
                <Card className="p-4">
                  <h2 className="mb-2.5 text-sm font-semibold text-fg">By payment method</h2>
                  <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {summary.by_method.map((method) => (
                      <li
                        key={method.payment_method}
                        className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-3 py-2"
                      >
                        <span className="text-[0.8125rem] text-fg-muted">
                          {method.label}
                          <span className="ml-1.5 text-xs text-fg-subtle">({method.count})</span>
                        </span>
                        <span className="num text-[0.8125rem] font-medium text-fg">
                          {formatInr(method.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </>
          ) : null}

          <TableContainer>
            <Table minWidth="62rem">
              <THead>
                <TH>Received</TH>
                <TH>Invoice</TH>
                <TH>Customer</TH>
                <TH>Method</TH>
                <TH>Reference</TH>
                <TH align="right">Amount</TH>
                <TH>Received by</TH>
              </THead>

              <TBody>
                {rows.length === 0 ? (
                  <TableEmptyRow colSpan={7}>
                    <EmptyState
                      icon={<Wallet />}
                      title="No payments in this period"
                      description="Record a payment against an invoice and it will appear here."
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
                      <TD className="whitespace-nowrap text-fg-muted">
                        {formatDateTime(row.received_at)}
                      </TD>
                      <TDPrimary href={`/invoices/${row.invoice_id}`}>
                        <CodeText>{row.invoice_number ?? `#${row.invoice_id}`}</CodeText>
                      </TDPrimary>
                      <TD className="max-w-[12rem] truncate whitespace-nowrap">
                        {row.customer_name ?? "Walk-in"}
                      </TD>
                      <TD>
                        <Badge tone="neutral" size="sm">
                          {row.payment_method_label}
                        </Badge>
                      </TD>
                      <TD className="max-w-[10rem] truncate whitespace-nowrap text-fg-muted">
                        {row.reference ?? "—"}
                      </TD>
                      <TD align="right" numeric className="font-medium text-fg">
                        {formatInr(row.amount)}
                      </TD>
                      <TD className="text-fg-muted">{row.received_by ?? "—"}</TD>
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
                label="payments"
              />
            ) : null}
          </TableContainer>
        </>
      )}
    </div>
  );
}
