import { Plus, Truck, Users } from "lucide-react";

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
import type {
  Customer,
  CustomerType,
  Pagination as PaginationMeta,
} from "@/features/invoicing/types";
import { DEALER_DEFAULT_FIELDS, dealerInvoiceDefaults } from "@/features/invoicing/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

const PER_PAGE = 25;

/**
 * Wording and routing for each directory. Dealers and customers are the same
 * table behind the same permission -- only the copy and the base path differ,
 * so one component serves both rather than two pages drifting apart.
 */
const COPY = {
  customer: {
    base: "/customers",
    title: "Customers",
    singular: "customer",
    description: "A GST invoice needs the customer's state code — it decides CGST+SGST vs IGST.",
    add: "Add customer",
    icon: <Users />,
    emptyTitle: "No customers yet",
    emptyBody: "Add a customer so you can raise GST invoices for them.",
    searchPlaceholder: "Search name, phone or GSTIN…",
  },
  dealer: {
    base: "/dealers",
    title: "Dealers",
    singular: "dealer",
    description:
      "Dealers you supply in bulk. Their dispatch details are filled in once here and copied onto every dealer invoice.",
    add: "Add dealer",
    icon: <Truck />,
    emptyTitle: "No dealers yet",
    emptyBody:
      "Add a dealer once, and raising a dealer invoice for them fills in the dispatch details for you.",
    searchPlaceholder: "Search name, phone or GSTIN…",
  },
} as const satisfies Record<CustomerType, unknown>;

export async function CustomerDirectory({
  type,
  searchParams,
}: {
  type: CustomerType;
  searchParams: { page?: string; search?: string };
}) {
  const copy = COPY[type];
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.customersView)) {
    return (
      <PermissionNotice>
        You do not have permission to view {copy.title.toLowerCase()}.
      </PermissionNotice>
    );
  }

  const canManage = hasPermission(user.permissions, PERMISSIONS.customersManage);

  const query = new URLSearchParams({ per_page: String(PER_PAGE), type });
  if (searchParams.page) query.set("page", searchParams.page);
  if (searchParams.search) query.set("search", searchParams.search);

  let customers: Customer[] = [];
  let meta: PaginationMeta | null = null;
  let loadError: string | null = null;

  try {
    const response = await apiFetch<Customer[]>(`/customers?${query.toString()}`);

    customers = response.data;
    meta = (response.meta?.pagination as PaginationMeta | undefined) ?? null;
  } catch (error) {
    loadError =
      error instanceof ApiError ? error.message : `Could not load ${copy.title.toLowerCase()}.`;
  }

  const dealers = type === "dealer";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={copy.title}
        description={copy.description}
        action={
          canManage ? (
            <ButtonLink href={`${copy.base}/new`} variant="primary">
              <Plus aria-hidden="true" />
              {copy.add}
            </ButtonLink>
          ) : null
        }
      />

      <form method="get" action={copy.base} className="flex flex-wrap items-center gap-2.5">
        <div className="min-w-[15rem] flex-1 sm:max-w-xs">
          <label htmlFor="customer-search" className="sr-only">
            Search {copy.title.toLowerCase()}
          </label>
          <input
            id="customer-search"
            name="search"
            type="search"
            defaultValue={searchParams.search ?? ""}
            placeholder={copy.searchPlaceholder}
            className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
          />
        </div>
        <ButtonLink href={copy.base} variant="ghost">
          Reset
        </ButtonLink>
      </form>

      {loadError ? (
        <ErrorNotice>{loadError}</ErrorNotice>
      ) : (
        <TableContainer>
          <Table minWidth={dealers ? "58rem" : "52rem"}>
            <THead>
              <TH>{dealers ? "Dealer" : "Customer"}</TH>
              <TH>Phone</TH>
              <TH>City</TH>
              <TH>State code</TH>
              <TH>GSTIN</TH>
              {dealers ? <TH>Dispatch defaults</TH> : null}
              <TH>Status</TH>
            </THead>

            <TBody>
              {customers.length === 0 ? (
                <TableEmptyRow colSpan={dealers ? 7 : 6}>
                  <EmptyState
                    icon={copy.icon}
                    title={searchParams.search ? `No ${copy.title.toLowerCase()} match` : copy.emptyTitle}
                    description={
                      searchParams.search ? "Try a different search term." : copy.emptyBody
                    }
                    action={
                      canManage && !searchParams.search ? (
                        <ButtonLink href={`${copy.base}/new`} variant="primary" size="sm">
                          <Plus aria-hidden="true" />
                          {copy.add}
                        </ButtonLink>
                      ) : null
                    }
                  />
                </TableEmptyRow>
              ) : (
                customers.map((customer) => (
                  <TR key={customer.id}>
                    <TDPrimary href={canManage ? `${copy.base}/${customer.id}/edit` : undefined}>
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
                    {dealers ? (
                      <TD>
                        <DispatchDefaultsCell customer={customer} />
                      </TD>
                    ) : null}
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
                `${copy.base}?${new URLSearchParams({
                  ...(searchParams.search ? { search: searchParams.search } : {}),
                  page: String(page),
                }).toString()}`
              }
              label={copy.title.toLowerCase()}
            />
          ) : null}
        </TableContainer>
      )}
    </div>
  );
}

/**
 * What raising a dealer invoice will actually prefill.
 *
 * Shows the EFFECTIVE defaults, not the stored columns: destination falls back
 * to the dealer's city, so a dealer with a city but no explicit destination
 * does prefill something, and reporting "Not set" there would be a lie the
 * operator can see through the moment they raise an invoice.
 */
function DispatchDefaultsCell({ customer }: { customer: Customer }) {
  const defaults = dealerInvoiceDefaults(customer);
  const filled = DEALER_DEFAULT_FIELDS.map((field) => defaults[field.target]).filter(Boolean);

  if (filled.length === 0) {
    return (
      <Badge tone="warning" size="sm">
        Not set
      </Badge>
    );
  }

  return (
    <span className="text-fg-muted">
      {[defaults.dispatched_through, defaults.destination].filter(Boolean).join(" · ") ||
        filled[0]}
      {filled.length < DEALER_DEFAULT_FIELDS.length ? (
        <span className="text-fg-subtle">
          {" "}
          · {filled.length}/{DEALER_DEFAULT_FIELDS.length}
        </span>
      ) : null}
    </span>
  );
}
