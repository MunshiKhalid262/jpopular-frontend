import type { Metadata } from "next";
import Link from "next/link";

import { PermissionNotice } from "@/components/ui/table";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { BrandForm } from "@/features/catalog/components/BrandForm";

export const metadata: Metadata = { title: "Add brand · JPopular" };

export default async function NewBrandPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.brandsManage)) {
    return <PermissionNotice>You do not have permission to create brands.</PermissionNotice>;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/brands" className="text-sm text-brand hover:text-brand-strong">
          ← Back to brands
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">Add brand</h1>
      </header>

      <div className="rounded-xl border border-line bg-surface p-6">
        <BrandForm />
      </div>
    </div>
  );
}
