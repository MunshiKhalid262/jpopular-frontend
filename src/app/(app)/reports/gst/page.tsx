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
import type { GstRow, GstSummary } from "@/features/reporting/types";
import { formatInr } from "@/lib/money";

export const metadata: Metadata = { title: "GST sales report" };

const KEYS = ["date_from", "date_to", "supply_type", "customer_id", "status"] as const;
const PATH = "/reports/gst";

export default async function GstReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!canViewReport(user.permissions, PERMISSIONS.reportsGst)) {
    return <PermissionNotice>You do not have permission to view the GST report.</PermissionNotice>;
  }

  const { rows, summary, meta, period, error } = await fetchReport<GstRow, GstSummary>(
    PATH,
    reportQuery(params, KEYS),
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="GST sales report"
        description={
          period
            ? `GST invoices from ${period.from} to ${period.to}. An internal business report — not a GST return.`
            : "GST invoices for the selected period."
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
            name: "supply_type",
            label: "Supply type",
            value: params.supply_type,
            placeholder: "Any supply type",
            width: "w-full sm:w-44",
            options: [
              { value: "intra_state", label: "Intra-state (CGST+SGST)" },
              { value: "inter_state", label: "Inter-state (IGST)" },
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
                { label: "Taxable sales", value: formatInr(summary.taxable), emphasis: true },
                { label: "CGST", value: formatInr(summary.cgst) },
                { label: "SGST", value: formatInr(summary.sgst) },
                { label: "IGST", value: formatInr(summary.igst) },
                { label: "Total GST", value: formatInr(summary.total_tax), emphasis: true },
              ]}
            />
          ) : null}

          <TableContainer>
            <Table minWidth="78rem">
              <THead>
                <TH>Date</TH>
                <TH>Invoice</TH>
                <TH>Customer</TH>
                <TH>GSTIN</TH>
                <TH>Supply</TH>
                <TH align="right">Taxable</TH>
                <TH align="right">CGST</TH>
                <TH align="right">SGST</TH>
                <TH align="right">IGST</TH>
                <TH align="right">Total GST</TH>
                <TH align="right">Invoice total</TH>
              </THead>

              <TBody>
                {rows.length === 0 ? (
                  <TableEmptyRow colSpan={11}>
                    <EmptyState
                      icon={<FileText />}
                      title="No GST invoices in this period"
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
                      <TD className="max-w-[11rem] truncate whitespace-nowrap">
                        {row.customer_name ?? "Walk-in"}
                      </TD>
                      <TD className="text-fg-muted">
                        {row.customer_gstin ? <CodeText>{row.customer_gstin}</CodeText> : "—"}
                      </TD>
                      <TD>
                        <Badge tone="neutral" size="sm">
                          {row.supply_type === "inter_state" ? "Inter" : "Intra"}
                        </Badge>
                      </TD>
                      <TD align="right" numeric>
                        {formatInr(row.taxable_amount)}
                      </TD>
                      <TD align="right" numeric>
                        {formatInr(row.cgst_amount)}
                      </TD>
                      <TD align="right" numeric>
                        {formatInr(row.sgst_amount)}
                      </TD>
                      <TD align="right" numeric>
                        {formatInr(row.igst_amount)}
                      </TD>
                      <TD align="right" numeric className="font-medium text-fg">
                        {formatInr(row.total_tax)}
                      </TD>
                      <TD align="right" numeric className="font-medium text-fg">
                        {formatInr(row.grand_total)}
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
