"use client";

import { Search, X } from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { SearchInput, Select } from "@/components/ui/input";
import type { Brand, Category } from "@/features/catalog/types";

/**
 * Product list filter bar.
 *
 * A real <form method="get">, so every filter state is a shareable URL and the
 * whole bar works without JavaScript. All controls are named fields, so a
 * native submit already produces the correct query string -- there is no
 * client state to keep in sync, and dropping `page` from the submission
 * naturally returns to page 1 when filters change.
 *
 * JavaScript adds exactly one thing: the selects submit on change, so choosing
 * a filter does not also require pressing Apply.
 */
export function ProductFilters({
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
    is_active?: string;
  };
}) {
  const hasFilters = Boolean(
    values.search || values.category_id || values.brand_id || values.is_active,
  );

  return (
    <form method="get" action="/products" className="flex flex-wrap items-center gap-2.5">
      <div className="min-w-[15rem] flex-1 sm:max-w-xs">
        <label htmlFor="product-search" className="sr-only">
          Search products by name, SKU or model
        </label>
        <SearchInput
          id="product-search"
          name="search"
          defaultValue={values.search ?? ""}
          placeholder="Search name, SKU or model…"
          icon={<Search />}
        />
      </div>

      <div className="w-full sm:w-44">
        <label htmlFor="filter-category" className="sr-only">
          Filter by category
        </label>
        <Select
          id="filter-category"
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
        <label htmlFor="filter-brand" className="sr-only">
          Filter by brand
        </label>
        <Select
          id="filter-brand"
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

      <div className="w-full sm:w-32">
        <label htmlFor="filter-status" className="sr-only">
          Filter by status
        </label>
        <Select
          id="filter-status"
          name="is_active"
          defaultValue={values.is_active ?? ""}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          <option value="">Any status</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </Select>
      </div>

      <Button type="submit" variant="secondary">
        Apply
      </Button>

      {hasFilters ? (
        <ButtonLink href="/products" variant="ghost">
          <X aria-hidden="true" />
          Reset
        </ButtonLink>
      ) : null}
    </form>
  );
}
