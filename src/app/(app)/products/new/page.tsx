import type { Metadata } from "next";
import Link from "next/link";

import { ErrorNotice, PermissionNotice } from "@/components/ui/table";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { ProductForm } from "@/features/catalog/components/ProductForm";
import type { Brand, Category } from "@/features/catalog/types";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Add product · JPopular" };

export default async function NewProductPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.productsCreate)) {
    return <PermissionNotice>You do not have permission to create products.</PermissionNotice>;
  }

  const [categoryResponse, brandResponse] = await Promise.all([
    apiFetch<Category[]>("/categories?per_page=100&is_active=1"),
    apiFetch<Brand[]>("/brands?per_page=100&is_active=1"),
  ]);

  if (categoryResponse.data.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <ErrorNotice>
          There are no active categories yet. A product must belong to a category.
        </ErrorNotice>
        <Link href="/categories/new" className="text-sm font-medium text-brand hover:underline">
          Create a category first →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/products" className="text-sm text-brand hover:text-brand-strong">
          ← Back to products
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">Add product</h1>
        <p className="mt-1 text-sm text-ink-muted">
          New products start with zero stock. Record opening stock in Inventory.
        </p>
      </header>

      <div className="rounded-xl border border-line bg-surface p-6">
        <ProductForm
          categories={categoryResponse.data}
          brands={brandResponse.data}
          canViewPurchasePrice={hasPermission(
            user.permissions,
            PERMISSIONS.productsViewPurchasePrice,
          )}
        />
      </div>
    </div>
  );
}
