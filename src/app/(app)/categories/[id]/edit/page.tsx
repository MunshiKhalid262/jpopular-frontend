import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PermissionNotice } from "@/components/ui/table";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { CategoryForm } from "@/features/catalog/components/CategoryForm";
import type { Category } from "@/features/catalog/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Edit category · JPopular" };

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

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/categories" className="text-sm text-brand hover:text-brand-strong">
          ← Back to categories
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">{category.name}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {category.products_count ?? 0} product(s) use this category.
        </p>
      </header>

      <div className="rounded-xl border border-line bg-surface p-6">
        <CategoryForm category={category} />
      </div>
    </div>
  );
}
