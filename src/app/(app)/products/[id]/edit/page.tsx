import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PermissionNotice } from "@/components/ui/table";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { ProductForm } from "@/features/catalog/components/ProductForm";
import type { Brand, Category, Product } from "@/features/catalog/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Edit product · JPopular" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.productsUpdate)) {
    return <PermissionNotice>You do not have permission to edit products.</PermissionNotice>;
  }

  let product: Product;

  try {
    const response = await apiFetch<Product>(`/products/${id}`);
    product = response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [categoryResponse, brandResponse] = await Promise.all([
    apiFetch<Category[]>("/categories?per_page=100&is_active=1"),
    apiFetch<Brand[]>("/brands?per_page=100&is_active=1"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/products" className="text-sm text-brand hover:text-brand-strong">
          ← Back to products
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">{product.name}</h1>
        <p className="mt-1 font-mono text-xs text-ink-subtle">{product.sku}</p>
      </header>

      <div className="rounded-xl border border-line bg-surface p-6">
        <ProductForm
          product={product}
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
