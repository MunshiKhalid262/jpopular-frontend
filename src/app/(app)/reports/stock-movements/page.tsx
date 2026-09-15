import { History } from "lucide-react";
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
import { MOVEMENT_TYPE_FILTERS } from "@/features/inventory/types";
import { ReportFilters } from "@/features/reporting/components/ReportFilters";
import {
  canExport,
  canViewReport,
  exportHref,
  fetchReport,
  pageHref,
  reportQuery,
} from "@/features/reporting/report-page";
import type { MovementRow } from "@/features/reporting/types";
import { formatQuantity } from "@/lib/money";

export const metadata: Metadata = { title: "Stock movement report" };

const KEYS = ["date_from", "date_to", "type", "product_id"] as const;
const PATH = "/reports/stock-movements";

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

export default async function StockMovementReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!canViewReport(user.permissions, PERMISSIONS.reportsStock)) {
    return (
      <PermissionNotice>
        You do not have permission to view the stock movement report.
      </PermissionNotice>
    );
  }

  const { rows, meta, period, error } = await fetchReport<MovementRow, never>(
    PATH,
    reportQuery(params, KEYS),
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Stock movement report"
        description={
          period
            ? `The stock ledger from ${period.from} to ${period.to}. Append-only — corrections appear as new movements.`
            : "The stock ledger for the selected period."
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
            name: "type",
            label: "Movement type",
            value: params.type,
            placeholder: "All movement types",
            width: "w-full sm:w-48",
            options: MOVEMENT_TYPE_FILTERS.map((t) => ({ value: t.value, label: t.label })),
          },
        ]}
      />

      {error ? (
        <ErrorNotice>{error}</ErrorNotice>
      ) : (
        <TableContainer>
          <Table minWidth="78rem">
            <THead>
              <TH>Date</TH>
              <TH>Product</TH>
              <TH>SKU</TH>
              <TH>Movement</TH>
              <TH align="right">Quantity</TH>
              <TH align="right">Previous</TH>
              <TH align="right">New</TH>
              <TH>Reference</TH>
              <TH>User</TH>
              <TH>Note</TH>
            </THead>

            <TBody>
              {rows.length === 0 ? (
                <TableEmptyRow colSpan={10}>
                  <EmptyState
                    icon={<History />}
                    title="No movements in this period"
                    description="Try a wider date range, or a different movement type."
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
                      {formatDateTime(row.occurred_at)}
                    </TD>
                    <TDPrimary href={row.product_id ? `/products/${row.product_id}` : undefined}>
                      {row.product_name ?? "—"}
                    </TDPrimary>
                    <TD>{row.sku ? <CodeText>{row.sku}</CodeText> : "—"}</TD>
                    <TD>
                      <Badge tone={row.increases_stock ? "neutral" : "warning"} size="sm">
                        {row.type_label}
                      </Badge>
                    </TD>
                    {/* The stored sign is shown as-is: it is what makes the
                        ledger sum to current stock. */}
                    <TD
                      align="right"
                      numeric
                      className={
                        row.increases_stock ? "font-medium text-fg" : "font-medium text-warning-700"
                      }
                    >
                      {row.increases_stock ? "+" : ""}
                      {formatQuantity(row.quantity)}
                    </TD>
                    <TD align="right" numeric className="text-fg-subtle">
                      {formatQuantity(row.previous_stock)}
                    </TD>
                    <TD align="right" numeric className="font-medium text-fg">
                      {formatQuantity(row.new_stock)}
                    </TD>
                    <TD className="whitespace-nowrap text-fg-subtle">
                      {row.reference_label ?? "—"}
                    </TD>
                    <TD className="max-w-[9rem] truncate whitespace-nowrap text-fg-muted">
                      {row.user_name ?? "—"}
                    </TD>
                    <TD className="text-fg-muted">
                      <span className="block max-w-[12rem] truncate" title={row.note ?? undefined}>
                        {row.note ?? "—"}
                      </span>
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
              label="movements"
            />
          ) : null}
        </TableContainer>
      )}
    </div>
  );
}
