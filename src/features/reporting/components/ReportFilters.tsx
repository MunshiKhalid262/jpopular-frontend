"use client";

import { Download, Search, X } from "lucide-react";

import { Button, ButtonLink, buttonVariants } from "@/components/ui/button";
import { Input, SearchInput, Select } from "@/components/ui/input";

export type FilterOption = { value: string; label: string };

export type SelectFilter = {
  name: string;
  label: string;
  value?: string;
  placeholder: string;
  options: readonly FilterOption[];
  width?: string;
};

/**
 * The filter bar shared by every report.
 *
 * A real <form method="get">, like every other list page: the filter state is
 * the URL, so a report is shareable and works without JavaScript.
 *
 * The export button is a plain <a> carrying THE SAME query string, which is
 * what makes "export respects the current filters" true by construction rather
 * than by remembering to keep two code paths in step.
 */
export function ReportFilters({
  action,
  exportHref,
  canExport,
  showDates = true,
  showSearch = false,
  searchPlaceholder = "Search…",
  values,
  selects = [],
}: {
  action: string;
  exportHref?: string;
  canExport: boolean;
  showDates?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  values: Record<string, string | undefined>;
  selects?: SelectFilter[];
}) {
  const hasFilters = Object.values(values).some(Boolean);

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <form method="get" action={action} className="flex flex-wrap items-end gap-2.5">
        {showSearch ? (
          <div className="min-w-[13rem] sm:max-w-xs">
            <label htmlFor={`${action}-search`} className="sr-only">
              {searchPlaceholder}
            </label>
            <SearchInput
              id={`${action}-search`}
              name="search"
              defaultValue={values.search ?? ""}
              placeholder={searchPlaceholder}
              icon={<Search />}
            />
          </div>
        ) : null}

        {showDates ? (
          <>
            <div className="w-full sm:w-36">
              <label
                htmlFor={`${action}-from`}
                className="mb-1 block text-xs font-medium text-fg-muted"
              >
                From
              </label>
              <Input
                id={`${action}-from`}
                name="date_from"
                type="date"
                defaultValue={values.date_from ?? ""}
              />
            </div>
            <div className="w-full sm:w-36">
              <label
                htmlFor={`${action}-to`}
                className="mb-1 block text-xs font-medium text-fg-muted"
              >
                To
              </label>
              <Input
                id={`${action}-to`}
                name="date_to"
                type="date"
                defaultValue={values.date_to ?? ""}
              />
            </div>
          </>
        ) : null}

        {selects.map((filter) => (
          <div key={filter.name} className={filter.width ?? "w-full sm:w-40"}>
            <label htmlFor={`${action}-${filter.name}`} className="sr-only">
              {filter.label}
            </label>
            <Select
              id={`${action}-${filter.name}`}
              name={filter.name}
              defaultValue={filter.value ?? ""}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              <option value="">{filter.placeholder}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        ))}

        <Button type="submit" variant="secondary">
          Apply
        </Button>

        {hasFilters ? (
          <ButtonLink href={action} variant="ghost">
            <X aria-hidden="true" />
            Reset
          </ButtonLink>
        ) : null}
      </form>

      {canExport && exportHref ? (
        /*
         * A plain <a download>, not next/link (which would intercept the click
         * as a client navigation) and not a fetch-to-blob (which would discard
         * the server's filename).
         */
        <a href={exportHref} download className={buttonVariants({ variant: "secondary" })}>
          <Download aria-hidden="true" />
          Export CSV
        </a>
      ) : null}
    </div>
  );
}
