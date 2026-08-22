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
import type { Brand, Pagination as PaginationMeta } from "@/features/catalog/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Brands · JPopular" };

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; is_active?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.brandsView)) {
    return <PermissionNotice>You do not have permission to view brands.</PermissionNotice>;
  }

  const canManage = hasPermission(user.permissions, PERMISSIONS.brandsManage);

  const query = new URLSearchParams({ per_page: "25" });
  if (params.page) query.set("page", params.page);
  if (params.search) query.set("search", params.search);
  if (params.is_active) query.set("is_active", params.is_active);

  let brands: Brand[] = [];
  let meta: PaginationMeta | null = null;
  let loadError: string | null = null;

  try {
    const response = await apiFetch<Brand[]>(`/brands?${query.toString()}`);
    brands = response.data;
    meta = (response.meta?.pagination as PaginationMeta | undefined) ?? null;
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : "Could not load brands.";
  }

  const buildHref = (page: number) => {
    const next = new URLSearchParams();
    if (params.search) next.set("search", params.search);
    if (params.is_active) next.set("is_active", params.is_active);
    next.set("page", String(page));

    return `/brands?${next.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Brands"
        description="Manufacturers and suppliers whose products you stock."
        action={
          canManage ? (
            <Link
              href="/brands/new"
              className="inline-flex items-center rounded-[--radius-control] bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
            >
              Add brand
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
            placeholder="Brand name"
            className="w-56 rounded-[--radius-control] border border-line bg-surface px-3 py-2 text-sm"
          />
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
      </form>

      {loadError ? (
        <ErrorNotice>{loadError}</ErrorNotice>
      ) : (
        <>
          <TableShell minWidth="42rem">
            <Thead>
              <tr>
                <Th>Name</Th>
                <Th>Slug</Th>
                <Th align="right">Products</Th>
                <Th>Status</Th>
                {canManage ? <Th>Actions</Th> : null}
              </tr>
            </Thead>
            <tbody>
              {brands.length === 0 ? (
                <EmptyRow colSpan={canManage ? 5 : 4}>No brands found.</EmptyRow>
              ) : (
                brands.map((brand) => (
                  <tr key={brand.id} className="border-b border-line last:border-0">
                    <Td className="font-medium text-ink">{brand.name}</Td>
                    <Td className="font-mono text-xs text-ink-muted">{brand.slug}</Td>
                    <Td align="right" numeric>
                      {brand.products_count ?? 0}
                    </Td>
                    <Td>
                      <Badge tone={brand.is_active ? "success" : "danger"}>
                        {brand.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                    {canManage ? (
                      <Td>
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/brands/${brand.id}/edit`}
                            className="text-sm font-medium text-brand hover:text-brand-strong"
                          >
                            Edit
                          </Link>
                          <ArchiveButton
                            resource="brands"
                            id={brand.id}
                            confirmMessage={`Archive "${brand.name}"? Brands used by products cannot be archived — deactivate instead.`}
                          />
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
