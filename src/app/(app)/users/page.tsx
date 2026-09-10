import { Plus, Search, UserRoundPlus, Users as UsersIcon, X } from "lucide-react";
import type { Metadata } from "next";

import { RoleBadge, StatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, ErrorNotice, PermissionNotice } from "@/components/ui/feedback";
import { SearchInput, Select } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
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
import type { ManagedUser, Pagination as PaginationMeta } from "@/features/auth/types";
import { UserRowActions } from "@/features/users/components/UserRowActions";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Users" };

const PER_PAGE = 25;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; is_active?: string; role?: string }>;
}) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();

  if (!currentUser) return null;

  if (!hasPermission(currentUser.permissions, PERMISSIONS.usersView)) {
    return <PermissionNotice>You do not have permission to view users.</PermissionNotice>;
  }

  const canManage = hasPermission(currentUser.permissions, PERMISSIONS.usersManage);

  const query = new URLSearchParams({ per_page: String(PER_PAGE) });
  for (const key of ["page", "search", "is_active", "role"] as const) {
    const value = params[key];
    if (value) query.set(key, value);
  }

  let users: ManagedUser[] = [];
  let meta: PaginationMeta | null = null;
  let loadError: string | null = null;

  try {
    const response = await apiFetch<ManagedUser[]>(`/users?${query.toString()}`);
    users = response.data;
    meta = (response.meta?.pagination as PaginationMeta | undefined) ?? null;
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : "Could not load users.";
  }

  const buildHref = (page: number) => {
    const next = new URLSearchParams();
    for (const key of ["search", "is_active", "role"] as const) {
      const value = params[key];
      if (value) next.set(key, value);
    }
    next.set("page", String(page));

    return `/users?${next.toString()}`;
  };

  const isFiltered = Boolean(params.search || params.is_active || params.role);
  const columnCount = 5 + (canManage ? 1 : 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Users"
        description="Administrators and managers who can sign in. Roles decide what each person can reach."
        action={
          canManage ? (
            <ButtonLink href="/users/new" variant="primary">
              <Plus aria-hidden="true" />
              Add user
            </ButtonLink>
          ) : null
        }
      />

      <form method="get" action="/users" className="flex flex-wrap items-center gap-2.5">
        <div className="min-w-[15rem] flex-1 sm:max-w-xs">
          <label htmlFor="user-search" className="sr-only">
            Search users by name or email
          </label>
          <SearchInput
            id="user-search"
            name="search"
            defaultValue={params.search ?? ""}
            placeholder="Search name or email…"
            icon={<Search />}
          />
        </div>

        <div className="w-full sm:w-36">
          <label htmlFor="user-role" className="sr-only">
            Filter by role
          </label>
          <Select id="user-role" name="role" defaultValue={params.role ?? ""}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
          </Select>
        </div>

        <div className="w-full sm:w-32">
          <label htmlFor="user-status" className="sr-only">
            Filter by status
          </label>
          <Select id="user-status" name="is_active" defaultValue={params.is_active ?? ""}>
            <option value="">Any status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </Select>
        </div>

        <Button type="submit" variant="secondary">
          Apply
        </Button>

        {isFiltered ? (
          <ButtonLink href="/users" variant="ghost">
            <X aria-hidden="true" />
            Reset
          </ButtonLink>
        ) : null}
      </form>

      {loadError ? (
        <ErrorNotice>{loadError}</ErrorNotice>
      ) : (
        <TableContainer>
          <Table minWidth="52rem">
            <THead>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH>Last sign-in</TH>
              {canManage ? (
                <TH align="right" srOnly>
                  Actions
                </TH>
              ) : null}
            </THead>

            <TBody>
              {users.length === 0 ? (
                <TableEmptyRow colSpan={columnCount}>
                  {isFiltered ? (
                    <EmptyState
                      icon={<UsersIcon />}
                      title="No users match these filters"
                      action={
                        <ButtonLink href="/users" variant="secondary" size="sm">
                          Clear filters
                        </ButtonLink>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={<UserRoundPlus />}
                      title="No users yet"
                      description="Add a manager so someone else can raise invoices."
                      action={
                        canManage ? (
                          <ButtonLink href="/users/new" variant="primary" size="sm">
                            <Plus aria-hidden="true" />
                            Add user
                          </ButtonLink>
                        ) : null
                      }
                    />
                  )}
                </TableEmptyRow>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === currentUser.id;

                  return (
                    <TR key={user.id}>
                      <TDPrimary secondary={user.phone ?? undefined}>
                        {user.name}
                        {isSelf ? (
                          <span className="ml-2 text-xs font-normal text-fg-subtle">(you)</span>
                        ) : null}
                      </TDPrimary>

                      <TD>{user.email}</TD>

                      <TD>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => <RoleBadge key={role} role={role} />)
                          ) : (
                            <span className="text-xs text-fg-subtle">No role</span>
                          )}
                        </div>
                      </TD>

                      <TD>
                        <StatusBadge active={user.is_active} />
                      </TD>

                      <TD numeric>{formatDateTime(user.last_login_at)}</TD>

                      {canManage ? (
                        <TD align="right">
                          <UserRowActions
                            userId={user.id}
                            userName={user.name}
                            isActive={user.is_active}
                            isSelf={isSelf}
                          />
                        </TD>
                      ) : null}
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>

          {meta && users.length > 0 ? (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              perPage={meta.per_page}
              buildHref={buildHref}
              label="users"
            />
          ) : null}
        </TableContainer>
      )}
    </div>
  );
}

function formatDateTime(value: string | null): string {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
