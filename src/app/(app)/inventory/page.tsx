import { History, PackageSearch } from "lucide-react";
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
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import type { Brand, Category } from "@/features/catalog/types";
import { InventoryFilters } from "@/features/inventory/components/InventoryFilters";
import { StockRowActions } from "@/features/inventory/components/StockRowActions";
import { StockStatusBadge } from "@/features/inventory/components/StockStatusBadge";
import type { Pagination as PaginationMeta, StockSummary } from "@/features/inventory/types";
import { ApiError } from "@/lib/api-error";
import { formatQuantity } from "@/lib/money";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Stock" };

const PER_PAGE = 25;

type Filters = {
  page?: string;
  search?: string;
  category_id?: string;
  brand_id?: string;
  stock_status?: string;
  low_stock?: string;
};

const FILTER_KEYS = ["search", "category_id", "brand_id", "stock_status", "low_stock"] as const;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.inventoryView)) {
    return <PermissionNotice>You do not have permission to view inventory.</PermissionNotice>;
  }

  const canAdjust = hasPermission(user.permissions, PERMISSIONS.inventoryAdjust);

  const query = new URLSearchParams({ per_page: String(PER_PAGE) });
  if (params.page) query.set("page", params.page);
  for (const key of FILTER_KEYS) {
    const value = params[key];
    if (value) query.set(key, value);
  }

  let stock: StockSummary[] = [];
  let meta: PaginationMeta | null = null;
  let categories: Category[] = [];
  let brands: Brand[] = [];
  let loadError: string | null = null;

  try {
    const [stockResponse, categoryResponse, brandResponse] = await Promise.all([
      apiFetch<StockSummary[]>(`/inventory/stock?${query.toString()}`),
      apiFetch<Category[]>("/categories?per_page=100&is_active=1"),
      apiFetch<Brand[]>("/brands?per_page=100&is_active=1"),
    ]);

    stock = stockResponse.data;
    meta = (stockResponse.meta?.pagination as PaginationMeta | undefined) ?? null;
    categories = categoryResponse.data;
    brands = brandResponse.data;
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : "Could not load inventory.";
  }

  const buildHref = (page: number) => {
    const next = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = params[key];
      if (value) next.set(key, value);
    }
    next.set("page", String(page));

    return `/inventory?${next.toString()}`;
  };

  const isFiltered = FILTER_KEYS.some((key) => Boolean(params[key]));

  // Product, SKU, Category, Brand, Current, Minimum, Unit, Status, Actions
  const columnCount = 9;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Stock"
        description="Current stock for every product. Adjustments are recorded in the ledger, so each change is auditable."
        action={
          <ButtonLink href="/inventory/movements" variant="secondary">
            <History aria-hidden="true" />
            Movement history
          </ButtonLink>
        }
      />

      <InventoryFilters
        categories={categories}
        brands={brands}
        values={{
          search: params.search,
          category_id: params.category_id,
          brand_id: params.brand_id,
          stock_status: params.stock_status,
          low_stock: params.low_stock,
        }}
      />

      {loadError ? (
        <ErrorNotice>{loadError}</ErrorNotice>
      ) : (
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
              <TH align="right" srOnly>
                Actions
              </TH>
            </THead>

            <TBody>
              {stock.length === 0 ? (
                <TableEmptyRow colSpan={columnCount}>
                  {isFiltered ? (
                    <EmptyState
                      icon={<PackageSearch />}
                      title="No products match these filters"
                      description="Try a different search term, or clear the filters to see all stock."
                      action={
                        <ButtonLink href="/inventory" variant="secondary" size="sm">
                          Clear filters
                        </ButtonLink>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={<PackageSearch />}
                      title="No products to track yet"
                      description="Add a product to the catalog first, then record its opening stock here."
                      action={
                        <ButtonLink href="/products" variant="secondary" size="sm">
                          Go to products
                        </ButtonLink>
                      }
                    />
                  )}
                </TableEmptyRow>
              ) : (
                stock.map((row) => (
                  <TR key={row.id}>
                    <TDPrimary href={`/products/${row.id}`}>{row.name}</TDPrimary>

                    <TD>
                      <CodeText>{row.sku}</CodeText>
                    </TD>

                    <TD className="max-w-[10rem] truncate whitespace-nowrap">
                      {row.category?.name ?? "—"}
                    </TD>
                    <TD className="max-w-[10rem] truncate whitespace-nowrap">
                      {row.brand?.name ?? "—"}
                    </TD>

                    <TD align="right" numeric className="font-medium text-fg">
                      {formatQuantity(row.current_stock)}
                    </TD>

                    <TD align="right" numeric>
                      {formatQuantity(row.min_stock_level)}
                    </TD>

                    <TD className="text-fg-subtle">{row.unit}</TD>

                    <TD>
                      <StockStatusBadge status={row.stock_status} />
                    </TD>

                    <TD align="right">
                      <StockRowActions product={row} canAdjust={canAdjust} />
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>

          {meta && stock.length > 0 ? (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              perPage={meta.per_page}
              buildHref={buildHref}
              label="products"
            />
          ) : null}
        </TableContainer>
      )}
    </div>
  );
}
