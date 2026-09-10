import { Boxes, History } from "lucide-react";
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
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { MovementFilters } from "@/features/inventory/components/MovementFilters";
import type { Pagination as PaginationMeta, StockMovement } from "@/features/inventory/types";
import { ApiError } from "@/lib/api-error";
import { formatQuantity } from "@/lib/money";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Stock movements" };

const PER_PAGE = 25;

type Filters = {
  page?: string;
  search?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
  product_id?: string;
};

const FILTER_KEYS = ["search", "type", "date_from", "date_to", "product_id"] as const;

/** "2026-09-11T10:30:00+05:30" -> "11 Sep 2026, 10:30" */
function formatDateTime(value: string | null): string {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default async function StockMovementsPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.inventoryView)) {
    return (
      <PermissionNotice>You do not have permission to view stock movements.</PermissionNotice>
    );
  }

  const query = new URLSearchParams({ per_page: String(PER_PAGE) });
  if (params.page) query.set("page", params.page);
  for (const key of FILTER_KEYS) {
    const value = params[key];
    if (value) query.set(key, value);
  }

  let movements: StockMovement[] = [];
  let meta: PaginationMeta | null = null;
  let loadError: string | null = null;

  try {
    const response = await apiFetch<StockMovement[]>(`/inventory/movements?${query.toString()}`);

    movements = response.data;
    meta = (response.meta?.pagination as PaginationMeta | undefined) ?? null;
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : "Could not load stock movements.";
  }

  const buildHref = (page: number) => {
    const next = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = params[key];
      if (value) next.set(key, value);
    }
    next.set("page", String(page));

    return `/inventory/movements?${next.toString()}`;
  };

  const isFiltered = FILTER_KEYS.some((key) => Boolean(params[key]));

  /*
   * The product name for the "scoped to" banner. Taken from the rows already
   * loaded rather than a second request: when a product_id filter returns
   * rows, every one of them is that product.
   */
  const scopedProductLabel =
    params.product_id && movements.length > 0 ? (movements[0].product?.name ?? null) : null;

  // Date, Product, SKU, Type, Quantity, Previous, New, Note, User, Reference
  const columnCount = 10;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Stock movements"
        description="Every change to stock, newest first. The ledger is append-only — corrections are recorded as new movements, never edits."
        action={
          <ButtonLink href="/inventory" variant="secondary">
            <Boxes aria-hidden="true" />
            Back to stock
          </ButtonLink>
        }
      />

      <MovementFilters
        values={{
          search: params.search,
          type: params.type,
          date_from: params.date_from,
          date_to: params.date_to,
          product_id: params.product_id,
        }}
        scopedProductLabel={scopedProductLabel}
      />

      {loadError ? (
        <ErrorNotice>{loadError}</ErrorNotice>
      ) : (
        <TableContainer>
          <Table minWidth="76rem">
            <THead>
              <TH>Date</TH>
              <TH>Product</TH>
              <TH>SKU</TH>
              <TH>Type</TH>
              <TH align="right">Quantity</TH>
              <TH align="right">Previous</TH>
              <TH align="right">New</TH>
              <TH>Note</TH>
              <TH>User</TH>
              <TH>Reference</TH>
            </THead>

            <TBody>
              {movements.length === 0 ? (
                <TableEmptyRow colSpan={columnCount}>
                  {isFiltered ? (
                    <EmptyState
                      icon={<History />}
                      title="No movements match these filters"
                      description="Try a wider date range, a different type, or clear the filters."
                      action={
                        <ButtonLink href="/inventory/movements" variant="secondary" size="sm">
                          Clear filters
                        </ButtonLink>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={<History />}
                      title="No stock movements yet"
                      description="Record opening stock or a stock-in from the Stock page and it will appear here."
                      action={
                        <ButtonLink href="/inventory" variant="secondary" size="sm">
                          Go to stock
                        </ButtonLink>
                      }
                    />
                  )}
                </TableEmptyRow>
              ) : (
                movements.map((movement) => (
                  <TR key={movement.id}>
                    <TD className="whitespace-nowrap text-fg-muted">
                      {formatDateTime(movement.occurred_at)}
                    </TD>

                    <TDPrimary href={`/products/${movement.product_id}`}>
                      {movement.product?.name ?? "—"}
                    </TDPrimary>

                    <TD>
                      {movement.product ? <CodeText>{movement.product.sku}</CodeText> : "—"}
                    </TD>

                    <TD>
                      {/*
                        Tone carries direction, not novelty: increases read
                        quietly, decreases are the ones worth spotting.
                      */}
                      <Badge tone={movement.increases_stock ? "neutral" : "warning"} size="sm">
                        {movement.type_label}
                      </Badge>
                    </TD>

                    {/* The stored sign is shown as-is: it is what makes the
                        ledger sum to current stock. */}
                    <TD
                      align="right"
                      numeric
                      className={
                        movement.increases_stock ? "font-medium text-fg" : "font-medium text-warning-700"
                      }
                    >
                      {movement.increases_stock ? "+" : ""}
                      {formatQuantity(movement.quantity)}
                    </TD>

                    <TD align="right" numeric className="text-fg-subtle">
                      {formatQuantity(movement.previous_stock)}
                    </TD>

                    <TD align="right" numeric className="font-medium text-fg">
                      {formatQuantity(movement.new_stock)}
                    </TD>

                    {/* Truncated to keep the row rhythm; the full note is
                        available on hover rather than lost. */}
                    <TD className="text-fg-muted">
                      <span
                        className="block max-w-[14rem] truncate"
                        title={movement.note ?? undefined}
                      >
                        {movement.note ?? "—"}
                      </span>
                    </TD>

                    <TD className="max-w-[9rem] truncate whitespace-nowrap text-fg-muted">
                      {movement.created_by?.name ?? "—"}
                    </TD>

                    <TD className="whitespace-nowrap text-fg-subtle">
                      {movement.reference_label ?? "—"}
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>

          {meta && movements.length > 0 ? (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              perPage={meta.per_page}
              buildHref={buildHref}
              label="movements"
            />
          ) : null}
        </TableContainer>
      )}
    </div>
  );
}
