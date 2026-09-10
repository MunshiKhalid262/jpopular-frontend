import { Tags } from "lucide-react";
import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, PermissionNotice } from "@/components/ui/feedback";
import { BackLink, PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { ProductForm } from "@/features/catalog/components/ProductForm";
import type { Brand, Category } from "@/features/catalog/types";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Add product" };

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

  // A product must belong to a category, so this is a hard prerequisite
  // rather than a validation error to discover after filling the form.
  if (categoryResponse.data.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <BackLink href="/products">Back to products</BackLink>

        <PageHeader title="Add product" />

        <Card>
          <CardBody className="py-14">
            <EmptyState
              icon={<Tags />}
              title="Create a category first"
              description="Every product must belong to a category, and there are no active categories yet."
              action={
                hasPermission(user.permissions, PERMISSIONS.categoriesManage) ? (
                  <ButtonLink href="/categories/new" variant="primary" size="sm">
                    Add a category
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/categories" variant="secondary" size="sm">
                    View categories
                  </ButtonLink>
                )
              }
            />
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <BackLink href="/products">Back to products</BackLink>

      <PageHeader
        title="Add product"
        description="New products start with zero stock. Record opening stock in Inventory."
      />

      <ProductForm
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
