import type { Metadata } from "next";
import Link from "next/link";

import { PermissionNotice } from "@/components/ui/table";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { CategoryForm } from "@/features/catalog/components/CategoryForm";

export const metadata: Metadata = { title: "Add category · JPopular" };

export default async function NewCategoryPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.categoriesManage)) {
    return <PermissionNotice>You do not have permission to create categories.</PermissionNotice>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/categories" className="text-sm text-brand hover:text-brand-strong">
          ← Back to categories
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">Add category</h1>
      </header>

      <div className="rounded-xl border border-line bg-surface p-6">
        <CategoryForm />
      </div>
    </div>
  );
}
