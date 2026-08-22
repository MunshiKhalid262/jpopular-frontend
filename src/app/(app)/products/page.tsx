import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/controls";
import {
  EmptyRow,
  ErrorNotice,
  PageHeader,
  Pagination,
  PermissionNotice,
  TableShell,
  Td,
  Th,
  Thead,
} from "@/components/ui/table";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { ArchiveButton } from "@/features/catalog/components/ArchiveButton";
import { ProductStatusToggle } from "@/features/catalog/components/ProductStatusToggle";
import type {
  Brand,
  Category,
  Pagination as PaginationMeta,
  Product,
} from "@/features/catalog/types";
import { ApiError } from "@/lib/api-error";
import { formatInr, formatPercent, formatQuantity } from "@/lib/money";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Products · JPopular" };

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

  const query = new URLSearchParams({ per_page: "25" });
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
    // Filter options load alongside the list; both are cheap at this scale.
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

  const columnCount = 8 + (canSeeCost ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Products"
        description="Scooters, batteries and accessories you sell."
        action={
          canCreate ? (
            <Link
              href="/products/new"
              className="inline-flex items-center rounded-[--radius-control] bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
            >
              Add product
            </Link>
          ) : null
        }
      />

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="search" className="text-xs font-medium text-ink-muted">
            Search
          </label>
          <input
            id="search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Name, SKU or model"
            className="w-60 rounded-[--radius-control] border border-line bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="category_id" className="text-xs font-medium text-ink-muted">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={params.category_id ?? ""}
            className="rounded-[--radius-control] border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="brand_id" className="text-xs font-medium text-ink-muted">
            Brand
          </label>
          <select
            id="brand_id"
            name="brand_id"
            defaultValue={params.brand_id ?? ""}
            className="rounded-[--radius-control] border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="is_active" className="text-xs font-medium text-ink-muted">
            Status
          </label>
          <select
            id="is_active"
            name="is_active"
            defaultValue={params.is_active ?? ""}
            className="rounded-[--radius-control] border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-[--radius-control] border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
        >
          Apply
        </button>

        <Link href="/products" className="px-1 py-2 text-sm text-ink-muted hover:text-ink">
          Reset
        </Link>
      </form>

      {loadError ? (
        <ErrorNotice>{loadError}</ErrorNotice>
      ) : (
        <>
          <TableShell minWidth={canSeeCost ? "72rem" : "64rem"}>
            <Thead>
              <tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>Category</Th>
                <Th>Brand</Th>
                <Th align="right">Selling</Th>
                {canSeeCost ? <Th align="right">Purchase</Th> : null}
                <Th align="right">GST</Th>
                <Th align="right">Stock</Th>
                <Th>Status</Th>
                {hasActions ? <Th>Actions</Th> : null}
              </tr>
            </Thead>
            <tbody>
              {products.length === 0 ? (
                <EmptyRow colSpan={columnCount}>No products found.</EmptyRow>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-line last:border-0">
                    <Td>
                      <Link
                        href={`/products/${product.id}`}
                        className="font-medium text-ink hover:text-brand"
                      >
                        {product.name}
                      </Link>
                      {product.model ? (
                        <span className="block text-xs text-ink-subtle">{product.model}</span>
                      ) : null}
                    </Td>
                    <Td className="font-mono text-xs text-ink-muted">{product.sku}</Td>
                    <Td className="text-ink-muted">{product.category?.name ?? "—"}</Td>
                    <Td className="text-ink-muted">{product.brand?.name ?? "—"}</Td>
                    <Td align="right" numeric>
                      {formatInr(product.selling_price)}
                    </Td>
                    {canSeeCost ? (
                      <Td align="right" numeric className="text-ink-muted">
                        {formatInr(product.purchase_price)}
                      </Td>
                    ) : null}
                    <Td align="right" numeric className="text-ink-muted">
                      {formatPercent(product.gst_rate)}
                    </Td>
                    <Td align="right" numeric>
                      {formatQuantity(product.current_stock)}
                      <span className="ml-1 text-xs text-ink-subtle">{product.unit}</span>
                    </Td>
                    <Td>
                      <Badge tone={product.is_active ? "success" : "danger"}>
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                    {hasActions ? (
                      <Td>
                        <div className="flex items-center gap-3">
                          {canUpdate ? (
                            <>
                              <Link
                                href={`/products/${product.id}/edit`}
                                className="text-sm font-medium text-brand hover:text-brand-strong"
                              >
                                Edit
                              </Link>
                              <ProductStatusToggle
                                productId={product.id}
                                isActive={product.is_active}
                              />
                            </>
                          ) : null}
                          {canDelete ? (
                            <ArchiveButton
                              resource="products"
                              id={product.id}
                              confirmMessage={`Archive "${product.name}"? It stays on historical invoices and can be restored.`}
                            />
                          ) : null}
                        </div>
                      </Td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </TableShell>

          {meta ? (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              buildHref={buildHref}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
