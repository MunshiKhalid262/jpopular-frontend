import { Plus, Users } from "lucide-react";
import type { Metadata } from "next";

import { Badge, StatusBadge } from "@/components/ui/badge";
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
import type { Customer, Pagination as PaginationMeta } from "@/features/invoicing/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Customers" };

const PER_PAGE = 25;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.customersView)) {
    return <PermissionNotice>You do not have permission to view customers.</PermissionNotice>;
  }

  const canManage = hasPermission(user.permissions, PERMISSIONS.customersManage);

  const query = new URLSearchParams({ per_page: String(PER_PAGE) });
  if (params.page) query.set("page", params.page);
  if (params.search) query.set("search", params.search);

  let customers: Customer[] = [];
  let meta: PaginationMeta | null = null;
  let loadError: string | null = null;

  try {
    const response = await apiFetch<Customer[]>(`/customers?${query.toString()}`);

    customers = response.data;
    meta = (response.meta?.pagination as PaginationMeta | undefined) ?? null;
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : "Could not load customers.";
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Customers"
        description="A GST invoice needs the customer's state code — it decides CGST+SGST vs IGST."
        action={
          canManage ? (
            <ButtonLink href="/customers/new" variant="primary">
              <Plus aria-hidden="true" />
              Add customer
            </ButtonLink>
          ) : null
        }
      />

      <form method="get" action="/customers" className="flex flex-wrap items-center gap-2.5">
        <div className="min-w-[15rem] flex-1 sm:max-w-xs">
          <label htmlFor="customer-search" className="sr-only">
            Search customers
          </label>
          <input
            id="customer-search"
            name="search"
            type="search"
            defaultValue={params.search ?? ""}
            placeholder="Search name, phone or GSTIN…"
            className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
          />
        </div>
        <ButtonLink href="/customers" variant="ghost">
          Reset
        </ButtonLink>
      </form>

      {loadError ? (
        <ErrorNotice>{loadError}</ErrorNotice>
      ) : (
        <TableContainer>
          <Table minWidth="52rem">
            <THead>
              <TH>Customer</TH>
              <TH>Phone</TH>
              <TH>City</TH>
              <TH>State code</TH>
              <TH>GSTIN</TH>
              <TH>Status</TH>
            </THead>

            <TBody>
              {customers.length === 0 ? (
                <TableEmptyRow colSpan={6}>
                  <EmptyState
                    icon={<Users />}
                    title={params.search ? "No customers match" : "No customers yet"}
                    description={
                      params.search
                        ? "Try a different search term."
                        : "Add a customer so you can raise GST invoices for them."
                    }
                    action={
                      canManage && !params.search ? (
                        <ButtonLink href="/customers/new" variant="primary" size="sm">
                          <Plus aria-hidden="true" />
                          Add customer
                        </ButtonLink>
                      ) : null
                    }
                  />
                </TableEmptyRow>
              ) : (
                customers.map((customer) => (
                  <TR key={customer.id}>
                    <TDPrimary
                      href={canManage ? `/customers/${customer.id}/edit` : undefined}
                    >
                      {customer.name}
                    </TDPrimary>
                    <TD className="text-fg-muted">{customer.phone ?? "—"}</TD>
                    <TD className="text-fg-muted">{customer.city ?? "—"}</TD>
                    <TD>
                      {customer.state_code ? (
                        <CodeText>{customer.state_code}</CodeText>
                      ) : (
                        // Flagged, because a GST invoice for this customer
                        // cannot be finalized until it is set.
                        <Badge tone="warning" size="sm">
                          Missing
                        </Badge>
                      )}
                    </TD>
                    <TD className="text-fg-muted">
                      {customer.gstin ? <CodeText>{customer.gstin}</CodeText> : "—"}
                    </TD>
                    <TD>
                      <StatusBadge active={customer.is_active} size="sm" />
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>

          {meta && customers.length > 0 ? (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              perPage={meta.per_page}
              buildHref={(page) =>
                `/customers?${new URLSearchParams({
                  ...(params.search ? { search: params.search } : {}),
                  page: String(page),
                }).toString()}`
              }
              label="customers"
            />
          ) : null}
        </TableContainer>
      )}
    </div>
  );
}
