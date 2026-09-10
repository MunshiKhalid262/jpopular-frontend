import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/ui/badge";
import { PermissionNotice } from "@/components/ui/feedback";
import { BackLink, PageHeader } from "@/components/ui/page-header";
import { CodeText } from "@/components/ui/table";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { ProductForm } from "@/features/catalog/components/ProductForm";
import type { Brand, Category, Product } from "@/features/catalog/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Edit product" };

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
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <BackLink href={`/products/${product.id}`}>Back to product</BackLink>

      <PageHeader
        title={product.name}
        description="Changes apply immediately. Stock is managed separately in Inventory."
        action={
          <div className="flex items-center gap-2">
            <CodeText>{product.sku}</CodeText>
            <StatusBadge active={product.is_active} />
          </div>
        }
      />

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
  );
}
