import { FileText, Plus } from "lucide-react";
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
import { InvoiceFilters } from "@/features/invoicing/components/InvoiceFilters";
import {
  InvoiceStatusBadge,
  TaxTypeBadge,
} from "@/features/invoicing/components/InvoiceStatusBadge";
import type { Invoice, Pagination as PaginationMeta } from "@/features/invoicing/types";
import { ApiError } from "@/lib/api-error";
import { formatInr } from "@/lib/money";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Invoices" };

const PER_PAGE = 25;

type Filters = {
  page?: string;
  search?: string;
  status?: string;
  tax_type?: string;
  date_from?: string;
  date_to?: string;
};

const FILTER_KEYS = ["search", "status", "tax_type", "date_from", "date_to"] as const;

function formatDate(value: string | null): string {
  if (!value) return "—";

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.invoicesView)) {
    return <PermissionNotice>You do not have permission to view invoices.</PermissionNotice>;
  }

  const canCreate = hasPermission(user.permissions, PERMISSIONS.invoicesCreate);

  const query = new URLSearchParams({ per_page: String(PER_PAGE) });
  if (params.page) query.set("page", params.page);
  for (const key of FILTER_KEYS) {
    const value = params[key];
    if (value) query.set(key, value);
  }

  let invoices: Invoice[] = [];
  let meta: PaginationMeta | null = null;
  let loadError: string | null = null;

  try {
    const response = await apiFetch<Invoice[]>(`/invoices?${query.toString()}`);

    invoices = response.data;
    meta = (response.meta?.pagination as PaginationMeta | undefined) ?? null;
  } catch (error) {
    loadError = error instanceof ApiError ? error.message : "Could not load invoices.";
  }

  const buildHref = (page: number) => {
    const next = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = params[key];
      if (value) next.set(key, value);
    }
    next.set("page", String(page));

    return `/invoices?${next.toString()}`;
  };

  const isFiltered = FILTER_KEYS.some((key) => Boolean(params[key]));

  // Number, Date, Customer, Type, Status, Total, Balance
  const columnCount = 7;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Invoices"
        description="Drafts can be edited. A finalized invoice is a legal document — cancel it rather than changing it."
        action={
          canCreate ? (
            <ButtonLink href="/invoices/new" variant="primary">
              <Plus aria-hidden="true" />
              New invoice
            </ButtonLink>
          ) : null
        }
      />

      <InvoiceFilters
        values={{
          search: params.search,
          status: params.status,
          tax_type: params.tax_type,
          date_from: params.date_from,
          date_to: params.date_to,
        }}
      />

      {loadError ? (
        <ErrorNotice>{loadError}</ErrorNotice>
      ) : (
        <TableContainer>
          <Table minWidth="62rem">
            <THead>
              <TH>Invoice</TH>
              <TH>Date</TH>
              <TH>Customer</TH>
              <TH>Type</TH>
              <TH>Status</TH>
              <TH align="right">Total</TH>
              <TH align="right">Balance</TH>
            </THead>

            <TBody>
              {invoices.length === 0 ? (
                <TableEmptyRow colSpan={columnCount}>
                  {isFiltered ? (
                    <EmptyState
                      icon={<FileText />}
                      title="No invoices match these filters"
                      description="Try a different search term or date range, or clear the filters."
                      action={
                        <ButtonLink href="/invoices" variant="secondary" size="sm">
                          Clear filters
                        </ButtonLink>
                      }
                    />
                  ) : (
                    <EmptyState
                      icon={<FileText />}
                      title="No invoices yet"
                      description="Raise your first invoice. It starts as a draft you can edit, and stock is deducted only when you finalize it."
                      action={
                        canCreate ? (
                          <ButtonLink href="/invoices/new" variant="primary" size="sm">
                            <Plus aria-hidden="true" />
                            New invoice
                          </ButtonLink>
                        ) : null
                      }
                    />
                  )}
                </TableEmptyRow>
              ) : (
                invoices.map((invoice) => (
                  <TR key={invoice.id}>
                    <TDPrimary href={`/invoices/${invoice.id}`}>
                      {invoice.invoice_number ? (
                        <CodeText>{invoice.invoice_number}</CodeText>
                      ) : (
                        <span className="text-fg-muted">Draft #{invoice.id}</span>
                      )}
                    </TDPrimary>

                    <TD className="whitespace-nowrap text-fg-muted">
                      {formatDate(invoice.invoice_date)}
                    </TD>

                    <TD className="max-w-[14rem] truncate whitespace-nowrap">
                      {invoice.customer?.name ?? (
                        <span className="text-fg-subtle">Walk-in</span>
                      )}
                    </TD>

                    <TD>
                      <TaxTypeBadge taxType={invoice.tax_type} size="sm" />
                    </TD>

                    <TD>
                      <InvoiceStatusBadge status={invoice.status} size="sm" />
                    </TD>

                    <TD align="right" numeric className="font-medium text-fg">
                      {formatInr(invoice.grand_total)}
                    </TD>

                    <TD align="right" numeric>
                      {invoice.status === "cancelled" ? (
                        <span className="text-fg-subtle">—</span>
                      ) : (
                        formatInr(invoice.due_amount)
                      )}
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>

          {meta && invoices.length > 0 ? (
            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              total={meta.total}
              perPage={meta.per_page}
              buildHref={buildHref}
              label="invoices"
            />
          ) : null}
        </TableContainer>
      )}
    </div>
  );
}
