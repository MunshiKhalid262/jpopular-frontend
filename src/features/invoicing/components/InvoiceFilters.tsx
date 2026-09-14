"use client";

import { Search, X } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Input, SearchInput, Select } from "@/components/ui/input";
import {
  INVOICE_STATUS_FILTERS,
  TAX_TYPE_OPTIONS,
} from "@/features/invoicing/types";

/**
 * Invoice list filter bar.
 *
 * Same pattern as every other list page: a real GET form, so filter state is
 * the URL and the bar works without JavaScript.
 */
export function InvoiceFilters({
  values,
}: {
  values: {
    search?: string;
    status?: string;
    tax_type?: string;
    date_from?: string;
    date_to?: string;
  };
}) {
  const hasFilters = Boolean(
    values.search || values.status || values.tax_type || values.date_from || values.date_to,
  );

  return (
    <form method="get" action="/invoices" className="flex flex-wrap items-end gap-2.5">
      <div className="min-w-[14rem] flex-1 sm:max-w-xs">
        <label htmlFor="invoice-search" className="sr-only">
          Search invoices by number, customer name or phone
        </label>
        <SearchInput
          id="invoice-search"
          name="search"
          defaultValue={values.search ?? ""}
          placeholder="Search number, customer or phone…"
          icon={<Search />}
        />
      </div>

      <div className="w-full sm:w-36">
        <label htmlFor="invoice-status" className="sr-only">
          Filter by status
        </label>
        <Select
          id="invoice-status"
          name="status"
          defaultValue={values.status ?? ""}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <option value="">Any status</option>
          {INVOICE_STATUS_FILTERS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-full sm:w-40">
        <label htmlFor="invoice-type" className="sr-only">
          Filter by invoice type
        </label>
        <Select
          id="invoice-type"
          name="tax_type"
          defaultValue={values.tax_type ?? ""}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <option value="">Any type</option>
          {TAX_TYPE_OPTIONS.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-full sm:w-36">
        <label htmlFor="invoice-from" className="mb-1 block text-xs font-medium text-fg-muted">
          From
        </label>
        <Input id="invoice-from" name="date_from" type="date" defaultValue={values.date_from ?? ""} />
      </div>

      <div className="w-full sm:w-36">
        <label htmlFor="invoice-to" className="mb-1 block text-xs font-medium text-fg-muted">
          To
        </label>
        <Input id="invoice-to" name="date_to" type="date" defaultValue={values.date_to ?? ""} />
      </div>

      <Button type="submit" variant="secondary">
        Apply
      </Button>

      {hasFilters ? (
        <ButtonLink href="/invoices" variant="ghost">
          <X aria-hidden="true" />
          Reset
        </ButtonLink>
      ) : null}
    </form>
  );
}
