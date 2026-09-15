import { AlertTriangle } from "lucide-react";
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
import type { OutstandingRow, OutstandingSummary } from "@/features/reporting/types";
import { formatInr } from "@/lib/money";

export const metadata: Metadata = { title: "Outstanding report" };

const KEYS = ["date_from", "date_to", "customer_id"] as const;
const PATH = "/reports/outstanding";

/** Older debt reads louder. */
function ageTone(days: number | null): "neutral" | "warning" | "danger" {
  if (days === null) return "neutral";
  if (days >= 60) return "danger";
  if (days >= 30) return "warning";

  return "neutral";
}

export default async function OutstandingReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!canViewReport(user.permissions, PERMISSIONS.reportsPayments)) {
    return (
      <PermissionNotice>
        You do not have permission to view the outstanding report.
      </PermissionNotice>
    );
  }

  const { rows, summary, meta, error } = await fetchReport<OutstandingRow, OutstandingSummary>(
    PATH,
    reportQuery(params, KEYS),
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Outstanding"
        description="Finalized invoices still owing money, oldest first. Cancelled invoices are excluded — they owe nothing."
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
      />

      {error ? (
        <ErrorNotice>{error}</ErrorNotice>
      ) : (
        <>
          {summary ? (
            <SummaryCards
              items={[
                { label: "Invoices owing", value: String(summary.invoice_count) },
                { label: "Billed", value: formatInr(summary.billed) },
                { label: "Paid", value: formatInr(summary.paid) },
                {
                  label: "Total outstanding",
                  value: formatInr(summary.outstanding),
                  emphasis: true,
                },
              ]}
            />
          ) : null}

          <TableContainer>
            <Table minWidth="62rem">
              <THead>
                <TH>Invoice</TH>
                <TH>Date</TH>
                <TH>Customer</TH>
                <TH>Phone</TH>
                <TH align="right">Grand total</TH>
                <TH align="right">Paid</TH>
                <TH align="right">Outstanding</TH>
                <TH align="right">Age</TH>
              </THead>

              <TBody>
                {rows.length === 0 ? (
                  <TableEmptyRow colSpan={8}>
                    <EmptyState
                      icon={<AlertTriangle />}
                      title="Nothing outstanding"
                      description="Every finalized invoice has been paid in full."
                    />
                  </TableEmptyRow>
                ) : (
                  rows.map((row) => (
                    <TR key={row.id}>
                      <TDPrimary href={`/invoices/${row.id}`}>
                        <CodeText>{row.invoice_number ?? `#${row.id}`}</CodeText>
                      </TDPrimary>
                      <TD className="whitespace-nowrap text-fg-muted">{row.invoice_date ?? "—"}</TD>
                      <TD className="max-w-[12rem] truncate whitespace-nowrap">
                        {row.customer_name ?? "Walk-in"}
                      </TD>
                      <TD className="text-fg-muted">{row.customer_phone ?? "—"}</TD>
                      <TD align="right" numeric>
                        {formatInr(row.grand_total)}
                      </TD>
                      <TD align="right" numeric>
                        {formatInr(row.paid_amount)}
                      </TD>
                      <TD align="right" numeric className="font-semibold text-fg">
                        {formatInr(row.outstanding)}
                      </TD>
                      <TD align="right">
                        {row.days_outstanding === null ? (
                          <span className="text-fg-subtle">—</span>
                        ) : (
                          <Badge tone={ageTone(row.days_outstanding)} size="sm">
                            {row.days_outstanding}d
                          </Badge>
                        )}
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
