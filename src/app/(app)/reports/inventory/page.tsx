import { PackageSearch } from "lucide-react";
import type { Metadata } from "next";

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
import type { Brand, Category } from "@/features/catalog/types";
import { StockStatusBadge } from "@/features/inventory/components/StockStatusBadge";
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
import type { InventoryRow, InventorySummary } from "@/features/reporting/types";
import { formatQuantity } from "@/lib/money";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Inventory report" };

const KEYS = ["search", "category_id", "brand_id", "stock_status"] as const;
const PATH = "/reports/inventory";

export default async function InventoryReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!canViewReport(user.permissions, PERMISSIONS.reportsInventory)) {
    return (
      <PermissionNotice>You do not have permission to view the inventory report.</PermissionNotice>
    );
  }

  const [report, categories, brands] = await Promise.all([
    fetchReport<InventoryRow, InventorySummary>(PATH, reportQuery(params, KEYS)),
    apiFetch<Category[]>("/categories?per_page=100&is_active=1").catch(() => ({ data: [] })),
    apiFetch<Brand[]>("/brands?per_page=100&is_active=1").catch(() => ({ data: [] })),
  ]);

  const { rows, summary, meta, error } = report;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Inventory report"
        description="Stock on hand, using the same status rules as the Inventory module."
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
        // Stock on hand is a position as at now, not a flow over a period.
        showDates={false}
        showSearch
        searchPlaceholder="Search name or SKU…"
        values={params}
        selects={[
          {
            name: "category_id",
            label: "Category",
            value: params.category_id,
            placeholder: "All categories",
            options: categories.data.map((c) => ({ value: String(c.id), label: c.name })),
          },
          {
            name: "brand_id",
            label: "Brand",
            value: params.brand_id,
            placeholder: "All brands",
            options: brands.data.map((b) => ({ value: String(b.id), label: b.name })),
          },
          {
            name: "stock_status",
            label: "Stock status",
            value: params.stock_status,
            placeholder: "Any status",
            options: [
              { value: "in_stock", label: "In stock" },
              { value: "low_stock", label: "Low stock" },
              { value: "out_of_stock", label: "Out of stock" },
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
                { label: "Products", value: String(summary.product_count), emphasis: true },
                { label: "Low stock", value: String(summary.low_stock_count) },
                { label: "Out of stock", value: String(summary.out_of_stock_count) },
              ]}
            />
          ) : null}

          <TableContainer>
            <Table minWidth="62rem">
              <THead>
                <TH>Product</TH>
                <TH>SKU</TH>
                <TH>Category</TH>
                <TH>Brand</TH>
                <TH align="right">Current</TH>
                <TH align="right">Minimum</TH>
                <TH>Unit</TH>
                <TH>Status</TH>
              </THead>

              <TBody>
                {rows.length === 0 ? (
                  <TableEmptyRow colSpan={8}>
                    <EmptyState
                      icon={<PackageSearch />}
                      title="No products match these filters"
                      description="Try a different search term, or clear the filters."
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
                      <TDPrimary href={`/products/${row.id}`}>{row.name}</TDPrimary>
                      <TD>
                        <CodeText>{row.sku}</CodeText>
                      </TD>
                      <TD className="max-w-[10rem] truncate whitespace-nowrap">
                        {row.category_name ?? "—"}
                      </TD>
                      <TD className="max-w-[10rem] truncate whitespace-nowrap">
                        {row.brand_name ?? "—"}
                      </TD>
                      <TD align="right" numeric className="font-medium text-fg">
                        {formatQuantity(row.current_stock)}
                      </TD>
                      <TD align="right" numeric>
                        {formatQuantity(row.min_stock_level)}
                      </TD>
                      <TD className="text-fg-subtle">{row.unit}</TD>
                      <TD>
                        <StockStatusBadge status={row.stock_status} size="sm" />
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
                label="products"
              />
            ) : null}
          </TableContainer>
        </>
      )}
    </div>
  );
}
