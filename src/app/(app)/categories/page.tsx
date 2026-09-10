import { Plus, Search, Tags, X } from "lucide-react";
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
import type { Category, Pagination as PaginationMeta } from "@/features/catalog/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Categories" };

const PER_PAGE = 25;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; is_active?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.categoriesView)) {
    return <PermissionNotice>You do not have permission to view categories.</PermissionNotice>;
  }

  const canManage = hasPermission(user.permissions, PERMISSIONS.categoriesManage);

  const query = new URLSearchParams({ per_page: String(PER_PAGE) });
  if (params.page) query.set("page", params.page);
  if (params.search) query.set("search", params.search);
  if (params.is_active) query.set("is_active", params.is_active);

  let categories: Category[] = [];
  let meta: PaginationMeta | null = null;
  let loadError: string | null = null;

  try {
    const response = await apiFetch<Category[]>(`/categories?${query.toString()}`);
    categories = response.data;
    meta = (response.meta?.pagination as PaginationMeta | undefined) ?? null;
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : "Could not load categories.";
  }

  const buildHref = (page: number) => {
    const next = new URLSearchParams();
    if (params.search) next.set("search", params.search);
    if (params.is_active) next.set("is_active", params.is_active);
    next.set("page", String(page));

    return `/categories?${next.toString()}`;
  };

  const isFiltered = Boolean(params.search || params.is_active);
  const columnCount = 5 + (canManage ? 1 : 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Categories"
        description="Group products for filtering and reporting. A category in use cannot be archived."
        action={
          canManage ? (
            <ButtonLink href="/categories/new" variant="primary">
              <Plus aria-hidden="true" />
              Add category
            </ButtonLink>
          ) : null
        }
      />

      {/* Plain GET form: every filter state is a shareable URL and works
          without JavaScript. */}
      <form method="get" action="/categories" className="flex flex-wrap items-center gap-2.5">
        <div className="min-w-[15rem] flex-1 sm:max-w-xs">
          <label htmlFor="category-search" className="sr-only">
            Search categories by name
          </label>
          <SearchInput
            id="category-search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search category name…"
            icon={<Search />}
          />
        </div>

        <div className="w-full sm:w-32">
          <label htmlFor="category-status" className="sr-only">
            Filter by status
          </label>
          <Select id="category-status" name="is_active" defaultValue={params.is_active ?? ""}>
            <option value="">Any status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </Select>
        </div>

        <Button type="submit" variant="secondary">
          Apply
        </Button>

        {isFiltered ? (
          <ButtonLink href="/categories" variant="ghost">
            <X aria-hidden="true" />
            Reset
          </ButtonLink>
        ) : null}
      </form>

      {loadError ? (
        <ErrorNotice>{loadError}</ErrorNotice>
      ) : (
        <TableContainer>
          <Table minWidth="44rem">
            <THead>
              <TH>Category</TH>
              <TH>Slug</TH>
              <TH align="right">Products</TH>
              <TH>Status</TH>
              <TH>Created</TH>
              {canManage ? (
                <TH align="right" srOnly>
                  Actions
                </TH>
              ) : null}
            </THead>

            <TBody>
              {categories.length === 0 ? (
                <TableEmptyRow colSpan={columnCount}>
                  {isFiltered ? (
                    <EmptyState
                      icon={<Tags />}
                      title="No categories match these filters"
                      action={
                        <ButtonLink href="/categories" variant="secondary" size="sm">
                          Clear filters
                        </ButtonLink>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={<Tags />}
                      title="No categories yet"
                      description="Categories group your products. Create one before adding products."
                      action={
                        canManage ? (
                          <ButtonLink href="/categories/new" variant="primary" size="sm">
                            <Plus aria-hidden="true" />
                            Add category
                          </ButtonLink>
                        ) : null
                      }
                    />
                  )}
                </TableEmptyRow>
              ) : (
                categories.map((category) => (
                  <TR key={category.id}>
                    <TDPrimary secondary={category.description ?? undefined}>
                      {category.name}
                    </TDPrimary>

                    <TD>
                      <CodeText>{category.slug}</CodeText>
                    </TD>

                    <TD align="right" numeric className="font-medium text-fg">
                      {category.products_count ?? 0}
                    </TD>

                    <TD>
                      <StatusBadge active={category.is_active} />
                    </TD>

                    <TD>{formatDate(category.created_at)}</TD>

                    {canManage ? (
                      <TD align="right">
                        <SimpleRowActions
                          resource="categories"
                          id={category.id}
                          name={category.name}
                          editHref={`/categories/${category.id}/edit`}
                          canManage={canManage}
                          inUseCount={category.products_count ?? 0}
                        />
                      </TD>
                    ) : null}
                  </TR>
                ))
              )}
            </TBody>
          </Table>

          {meta && categories.length > 0 ? (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              perPage={meta.per_page}
              buildHref={buildHref}
              label="categories"
            />
          ) : null}
        </TableContainer>
      )}
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}
