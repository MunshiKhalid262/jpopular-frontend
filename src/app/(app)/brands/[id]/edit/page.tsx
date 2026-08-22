import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PermissionNotice } from "@/components/ui/table";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { BrandForm } from "@/features/catalog/components/BrandForm";
import type { Brand } from "@/features/catalog/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Edit brand · JPopular" };

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.brandsManage)) {
    return <PermissionNotice>You do not have permission to edit brands.</PermissionNotice>;
  }

  let brand: Brand;

  try {
    const response = await apiFetch<Brand>(`/brands/${id}`);
    brand = response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/brands" className="text-sm text-brand hover:text-brand-strong">
          ← Back to brands
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">{brand.name}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {brand.products_count ?? 0} product(s) use this brand.
        </p>
      </header>

      <div className="rounded-xl border border-line bg-surface p-6">
        <BrandForm brand={brand} />
      </div>
    </div>
  );
}
