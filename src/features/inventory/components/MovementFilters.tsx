"use client";

import { Search, X } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Input, SearchInput, Select } from "@/components/ui/input";
import { MOVEMENT_TYPE_FILTERS } from "@/features/inventory/types";

/**
 * Movement history filter bar.
 *
 * Same pattern as the catalog and stock bars: a real GET form, so the filter
 * state is the URL.
 *
 * `product_id` is carried in a hidden field rather than a control. It is set
 * by following "movement history" from a stock row, and would otherwise be
 * silently dropped the moment any other filter was applied -- which reads as
 * the page forgetting which product you asked about.
 */
export function MovementFilters({
  values,
  scopedProductLabel,
}: {
  values: {
    search?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
    product_id?: string;
  };
  /** Name of the product the list is scoped to, when it is scoped. */
  scopedProductLabel?: string | null;
}) {
  const hasFilters = Boolean(
    values.search || values.type || values.date_from || values.date_to || values.product_id,
  );

  return (
    <div className="flex flex-col gap-2.5">
      {scopedProductLabel ? (
        <div className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-fg-muted">
          <span>
            Showing movements for <span className="font-medium text-fg">{scopedProductLabel}</span>
          </span>
          <ButtonLink href="/inventory/movements" variant="ghost" size="sm">
            <X aria-hidden="true" />
            Show all products
          </ButtonLink>
        </div>
      ) : null}

      <form
        method="get"
        action="/inventory/movements"
        className="flex flex-wrap items-end gap-2.5"
      >
        {values.product_id ? (
          <input type="hidden" name="product_id" value={values.product_id} />
        ) : null}

        <div className="min-w-[14rem] flex-1 sm:max-w-xs">
          <label htmlFor="movement-search" className="sr-only">
            Search movements by product name or SKU
          </label>
          <SearchInput
            id="movement-search"
            name="search"
            defaultValue={values.search ?? ""}
            placeholder="Search product or SKU…"
            icon={<Search />}
          />
        </div>

        <div className="w-full sm:w-48">
          <label htmlFor="movement-type" className="sr-only">
            Filter by movement type
          </label>
          <Select
            id="movement-type"
            name="type"
            defaultValue={values.type ?? ""}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
          >
            <option value="">All movement types</option>
            {MOVEMENT_TYPE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-full sm:w-40">
          <label
            htmlFor="movement-date-from"
            className="mb-1 block text-xs font-medium text-fg-muted"
          >
            From
          </label>
          <Input
            id="movement-date-from"
            name="date_from"
            type="date"
            defaultValue={values.date_from ?? ""}
          />
        </div>

        <div className="w-full sm:w-40">
          <label
            htmlFor="movement-date-to"
            className="mb-1 block text-xs font-medium text-fg-muted"
          >
            To
          </label>
          <Input
            id="movement-date-to"
            name="date_to"
            type="date"
            defaultValue={values.date_to ?? ""}
          />
        </div>

        <Button type="submit" variant="secondary">
          Apply
        </Button>

        {hasFilters ? (
          <ButtonLink href="/inventory/movements" variant="ghost">
            <X aria-hidden="true" />
            Reset
          </ButtonLink>
        ) : null}
      </form>
    </div>
  );
}
