import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { PermissionNotice } from "@/components/ui/feedback";
import { BackLink, PageHeader } from "@/components/ui/page-header";
import { CodeText } from "@/components/ui/table";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { CategoryForm } from "@/features/catalog/components/CategoryForm";
import type { Category } from "@/features/catalog/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.categoriesManage)) {
    return <PermissionNotice>You do not have permission to edit categories.</PermissionNotice>;
  }

  let category: Category;

  try {
    const response = await apiFetch<Category>(`/categories/${id}`);
    category = response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const inUse = category.products_count ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <BackLink href="/categories">Back to categories</BackLink>

      <PageHeader
        title={category.name}
        description={
          inUse > 0
            ? `Used by ${inUse} product${inUse === 1 ? "" : "s"}. Deactivate rather than archive while in use.`
            : "Not used by any product yet."
        }
        action={
          <div className="flex items-center gap-2">
            <CodeText>{category.slug}</CodeText>
            <Badge tone={category.is_active ? "success" : "neutral"} dot>
              {category.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        }
      />

      <CategoryForm category={category} />
    </div>
  );
}
