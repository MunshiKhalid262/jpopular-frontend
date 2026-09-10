"use client";

import { Search, X } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, SearchInput, Select } from "@/components/ui/input";
import type { Brand, Category } from "@/features/catalog/types";
import { STOCK_STATUS_FILTERS } from "@/features/inventory/types";

/**
 * Stock list filter bar.
 *
 * A real <form method="get">, matching the catalog: every filter state is a
 * shareable URL and the bar works without JavaScript. JavaScript adds one
 * thing -- the selects and the checkbox submit on change, so choosing a filter
 * does not also require pressing Apply.
 */
export function InventoryFilters({
  categories,
  brands,
  values,
}: {
  categories: Category[];
  brands: Brand[];
  values: {
    search?: string;
    category_id?: string;
    brand_id?: string;
    stock_status?: string;
    low_stock?: string;
  };
}) {
  const hasFilters = Boolean(
    values.search ||
      values.category_id ||
      values.brand_id ||
      values.stock_status ||
      values.low_stock,
  );

  return (
    <form method="get" action="/inventory" className="flex flex-wrap items-center gap-2.5">
      <div className="min-w-[15rem] flex-1 sm:max-w-xs">
        <label htmlFor="inventory-search" className="sr-only">
          Search stock by product name, SKU or model
        </label>
        <SearchInput
          id="inventory-search"
          name="search"
          defaultValue={values.search ?? ""}
          placeholder="Search name, SKU or model…"
          icon={<Search />}
        />
      </div>

      <div className="w-full sm:w-44">
        <label htmlFor="inventory-category" className="sr-only">
          Filter by category
        </label>
        <Select
          id="inventory-category"
          name="category_id"
          defaultValue={values.category_id ?? ""}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-full sm:w-40">
        <label htmlFor="inventory-brand" className="sr-only">
          Filter by brand
        </label>
        <Select
          id="inventory-brand"
          name="brand_id"
          defaultValue={values.brand_id ?? ""}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <option value="">All brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="w-full sm:w-40">
        <label htmlFor="inventory-status" className="sr-only">
          Filter by stock status
        </label>
        <Select
          id="inventory-status"
          name="stock_status"
          defaultValue={values.stock_status ?? ""}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <option value="">Any stock status</option>
          {STOCK_STATUS_FILTERS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </Select>
      </div>

      {/*
        A shortcut for the one question this page exists to answer. It is
        narrower than stock_status=low_stock only in being one click, and the
        backend treats it the same way.
      */}
      <Checkbox
        name="low_stock"
        value="1"
        label="Low stock only"
        defaultChecked={values.low_stock === "1"}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      />

      <Button type="submit" variant="secondary">
        Apply
      </Button>

      {hasFilters ? (
        <ButtonLink href="/inventory" variant="ghost">
          <X aria-hidden="true" />
          Reset
        </ButtonLink>
      ) : null}
    </form>
  );
}
