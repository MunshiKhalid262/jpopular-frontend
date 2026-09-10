import { PackageSearch, Plus } from "lucide-react";
import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
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
import { ProductFilters } from "@/features/catalog/components/ProductFilters";
import { ProductRowActions } from "@/features/catalog/components/ProductRowActions";
import type {
  Brand,
  Category,
  Pagination as PaginationMeta,
  Product,
} from "@/features/catalog/types";
import { ApiError } from "@/lib/api-error";
import { formatInr, formatPercent, formatQuantity } from "@/lib/money";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Products" };

const PER_PAGE = 25;

type Filters = {
  page?: string;
  search?: string;
  category_id?: string;
  brand_id?: string;
  is_active?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.productsView)) {
    return <PermissionNotice>You do not have permission to view products.</PermissionNotice>;
  }

  const canCreate = hasPermission(user.permissions, PERMISSIONS.productsCreate);
  const canUpdate = hasPermission(user.permissions, PERMISSIONS.productsUpdate);
  const canDelete = hasPermission(user.permissions, PERMISSIONS.productsDelete);
  const canSeeCost = hasPermission(user.permissions, PERMISSIONS.productsViewPurchasePrice);
  const hasActions = canUpdate || canDelete;

  const query = new URLSearchParams({ per_page: String(PER_PAGE) });
  for (const key of ["page", "search", "category_id", "brand_id", "is_active"] as const) {
    const value = params[key];
    if (value) query.set(key, value);
  }

  let products: Product[] = [];
  let meta: PaginationMeta | null = null;
  let categories: Category[] = [];
  let brands: Brand[] = [];
  let loadError: string | null = null;

  try {
    const [productResponse, categoryResponse, brandResponse] = await Promise.all([
      apiFetch<Product[]>(`/products?${query.toString()}`),
      apiFetch<Category[]>("/categories?per_page=100&is_active=1"),
      apiFetch<Brand[]>("/brands?per_page=100&is_active=1"),
    ]);

    products = productResponse.data;
    meta = (productResponse.meta?.pagination as PaginationMeta | undefined) ?? null;
    categories = categoryResponse.data;
    brands = brandResponse.data;
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : "Could not load products.";
  }

  const buildHref = (page: number) => {
    const next = new URLSearchParams();
    for (const key of ["search", "category_id", "brand_id", "is_active"] as const) {
      const value = params[key];
      if (value) next.set(key, value);
    }
    next.set("page", String(page));

    return `/products?${next.toString()}`;
  };

  const isFiltered = Boolean(
    params.search || params.category_id || params.brand_id || params.is_active,
  );

  // Product, SKU, Category, Brand, Selling, [Purchase], GST, Stock, Status, [Actions]
  const columnCount = 9 + (canSeeCost ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Products"
        description="Scooters, batteries and accessories you sell. Stock is managed in Inventory."
        action={
          canCreate ? (
            <ButtonLink href="/products/new" variant="primary">
              <Plus aria-hidden="true" />
              Add product
            </ButtonLink>
          ) : null
        }
      />

      <ProductFilters
        categories={categories}
        brands={brands}
        values={{
          search: params.search,
          category_id: params.category_id,
          brand_id: params.brand_id,
          is_active: params.is_active,
        }}
      />

      {loadError ? (
        <ErrorNotice>{loadError}</ErrorNotice>
      ) : (
        <TableContainer>
          {/* Sized to fit a 1440px viewport with the sidebar: a wider floor
              pushed the actions column past the right edge. */}
          <Table minWidth={canSeeCost ? "66rem" : "58rem"}>
            <THead>
              <TH>Product</TH>
              <TH>SKU</TH>
              <TH>Category</TH>
              <TH>Brand</TH>
              {/* Short labels keep the header a single line; the currency is
                  obvious from the values. */}
              <TH align="right">Selling</TH>
              {canSeeCost ? <TH align="right">Purchase</TH> : null}
              <TH align="right">GST</TH>
              <TH align="right">Stock</TH>
              <TH>Status</TH>
              {hasActions ? (
                <TH align="right" srOnly>
                  Actions
                </TH>
              ) : null}
            </THead>

            <TBody>
              {products.length === 0 ? (
                <TableEmptyRow colSpan={columnCount}>
                  {isFiltered ? (
                    <EmptyState
                      icon={<PackageSearch />}
                      title="No products match these filters"
                      description="Try a different search term, or clear the filters to see the whole catalog."
                      action={
                        <ButtonLink href="/products" variant="secondary" size="sm">
                          Clear filters
                        </ButtonLink>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={<PackageSearch />}
                      title="No products yet"
                      description="Add your first scooter, battery or accessory to start building the catalog."
                      action={
                        canCreate ? (
                          <ButtonLink href="/products/new" variant="primary" size="sm">
                            <Plus aria-hidden="true" />
                            Add product
                          </ButtonLink>
                        ) : null
                      }
                    />
                  )}
                </TableEmptyRow>
              ) : (
                products.map((product) => (
                  <TR key={product.id}>
                    <TDPrimary href={`/products/${product.id}`} secondary={product.model}>
                      {product.name}
                    </TDPrimary>

                    <TD>
                      <CodeText>{product.sku}</CodeText>
                    </TD>

                    {/* Truncate rather than wrap: a two-line category name
                        breaks the row rhythm across the whole table. */}
                    <TD className="max-w-[10rem] truncate whitespace-nowrap">
                      {product.category?.name ?? "—"}
                    </TD>
                    <TD className="max-w-[10rem] truncate whitespace-nowrap">
                      {product.brand?.name ?? "—"}
                    </TD>

                    <TD align="right" numeric className="font-medium text-fg">
                      {formatInr(product.selling_price)}
                    </TD>

                    {canSeeCost ? (
                      <TD align="right" numeric>
                        {formatInr(product.purchase_price)}
                      </TD>
                    ) : null}

                    <TD align="right" numeric>
                      {formatPercent(product.gst_rate)}
                    </TD>

                    <TD align="right" numeric>
                      <span className="font-medium text-fg">
                        {formatQuantity(product.current_stock)}
                      </span>
                      <span className="ml-1 text-xs text-fg-subtle">{product.unit}</span>
                    </TD>

                    <TD>
                      <StatusBadge active={product.is_active} />
                    </TD>

                    {hasActions ? (
                      <TD align="right">
                        <ProductRowActions
                          productId={product.id}
                          productName={product.name}
                          isActive={product.is_active}
                          canUpdate={canUpdate}
                          canDelete={canDelete}
                        />
                      </TD>
                    ) : null}
                  </TR>
                ))
              )}
            </TBody>
          </Table>

          {meta && products.length > 0 ? (
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
