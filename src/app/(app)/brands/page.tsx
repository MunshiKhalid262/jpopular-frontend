import { Boxes, Plus, Search, X } from "lucide-react";
import type { Metadata } from "next";

import { StatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, ErrorNotice, PermissionNotice } from "@/components/ui/feedback";
import { SearchInput, Select } from "@/components/ui/input";
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
import { SimpleRowActions } from "@/features/catalog/components/SimpleRowActions";
import type { Brand, Pagination as PaginationMeta } from "@/features/catalog/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Brands" };

const PER_PAGE = 25;

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

  const query = new URLSearchParams({ per_page: String(PER_PAGE) });
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

  const isFiltered = Boolean(params.search || params.is_active);
  const columnCount = 4 + (canManage ? 1 : 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Brands"
        description="Manufacturers and suppliers whose products you stock. A brand in use cannot be archived."
        action={
          canManage ? (
            <ButtonLink href="/brands/new" variant="primary">
              <Plus aria-hidden="true" />
              Add brand
            </ButtonLink>
          ) : null
        }
      />

      <form method="get" action="/brands" className="flex flex-wrap items-center gap-2.5">
        <div className="min-w-[15rem] flex-1 sm:max-w-xs">
          <label htmlFor="brand-search" className="sr-only">
            Search brands by name
          </label>
          <SearchInput
            id="brand-search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search brand name…"
            icon={<Search />}
          />
        </div>

        <div className="w-full sm:w-32">
          <label htmlFor="brand-status" className="sr-only">
            Filter by status
          </label>
          <Select id="brand-status" name="is_active" defaultValue={params.is_active ?? ""}>
            <option value="">Any status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </Select>
        </div>

        <Button type="submit" variant="secondary">
          Apply
        </Button>

        {isFiltered ? (
          <ButtonLink href="/brands" variant="ghost">
            <X aria-hidden="true" />
            Reset
          </ButtonLink>
        ) : null}
      </form>

      {loadError ? (
        <ErrorNotice>{loadError}</ErrorNotice>
      ) : (
        <TableContainer>
          <Table minWidth="40rem">
            <THead>
              <TH>Brand</TH>
              <TH>Slug</TH>
              <TH align="right">Products</TH>
              <TH>Status</TH>
              {canManage ? (
                <TH align="right" srOnly>
                  Actions
                </TH>
              ) : null}
            </THead>

            <TBody>
              {brands.length === 0 ? (
                <TableEmptyRow colSpan={columnCount}>
                  {isFiltered ? (
                    <EmptyState
                      icon={<Boxes />}
                      title="No brands match these filters"
                      action={
                        <ButtonLink href="/brands" variant="secondary" size="sm">
                          Clear filters
                        </ButtonLink>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={<Boxes />}
                      title="No brands yet"
                      description="Brands are optional on a product, but they make filtering the catalog much easier."
                      action={
                        canManage ? (
                          <ButtonLink href="/brands/new" variant="primary" size="sm">
                            <Plus aria-hidden="true" />
                            Add brand
                          </ButtonLink>
                        ) : null
                      }
                    />
                  )}
                </TableEmptyRow>
              ) : (
                brands.map((brand) => (
                  <TR key={brand.id}>
                    <TDPrimary>{brand.name}</TDPrimary>

                    <TD>
                      <CodeText>{brand.slug}</CodeText>
                    </TD>

                    <TD align="right" numeric className="font-medium text-fg">
                      {brand.products_count ?? 0}
                    </TD>

                    <TD>
                      <StatusBadge active={brand.is_active} />
                    </TD>

                    {canManage ? (
                      <TD align="right">
                        <SimpleRowActions
                          resource="brands"
                          id={brand.id}
                          name={brand.name}
                          editHref={`/brands/${brand.id}/edit`}
                          canManage={canManage}
                          inUseCount={brand.products_count ?? 0}
                        />
                      </TD>
                    ) : null}
                  </TR>
                ))
              )}
            </TBody>
          </Table>

          {meta && brands.length > 0 ? (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              perPage={meta.per_page}
              buildHref={buildHref}
              label="brands"
            />
          ) : null}
        </TableContainer>
      )}
    </div>
  );
}
