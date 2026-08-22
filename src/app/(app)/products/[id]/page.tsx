import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/controls";
import { PermissionNotice } from "@/components/ui/table";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import type { Product } from "@/features/catalog/types";
import { ApiError } from "@/lib/api-error";
import { formatInr, formatPercent, formatQuantity } from "@/lib/money";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Product · JPopular" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b border-line py-2.5 last:border-0">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.productsView)) {
    return <PermissionNotice>You do not have permission to view products.</PermissionNotice>;
  }

  let product: Product;

  try {
    const response = await apiFetch<Product>(`/products/${id}`);
    product = response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const canUpdate = hasPermission(user.permissions, PERMISSIONS.productsUpdate);
  // The API omits purchase_price entirely without permission, so presence of
  // the key is itself the signal.
  const showCost = product.purchase_price !== undefined;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/products" className="text-sm text-brand hover:text-brand-strong">
            ← Back to products
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-ink">{product.name}</h1>
          <p className="mt-1 font-mono text-xs text-ink-subtle">{product.sku}</p>
        </div>

        <div className="flex items-center gap-3">
          <Badge tone={product.is_active ? "success" : "danger"}>
            {product.is_active ? "Active" : "Inactive"}
          </Badge>
          {canUpdate ? (
            <Link
              href={`/products/${product.id}/edit`}
              className="inline-flex items-center rounded-[--radius-control] bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong"
            >
              Edit
            </Link>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-line bg-surface p-5">
          <h2 className="mb-3 text-sm font-semibold text-ink">Details</h2>
          <dl>
            <Row label="Category">{product.category?.name ?? "—"}</Row>
            <Row label="Brand">{product.brand?.name ?? "—"}</Row>
            <Row label="Model">{product.model ?? "—"}</Row>
            <Row label="Unit">{product.unit}</Row>
            <Row label="HSN / SAC">{product.hsn_code ?? "—"}</Row>
            <Row label="GST rate">{formatPercent(product.gst_rate)}</Row>
            <Row label="Selling price">{formatInr(product.selling_price)}</Row>
            {showCost ? (
              <Row label="Purchase price">{formatInr(product.purchase_price)}</Row>
            ) : null}
            <Row label="Current stock">
              {formatQuantity(product.current_stock)} {product.unit}
            </Row>
            <Row label="Minimum stock level">
              {formatQuantity(product.min_stock_level)} {product.unit}
            </Row>
          </dl>

          {product.description ? (
            <div className="mt-4 border-t border-line pt-4">
              <h3 className="text-sm font-semibold text-ink">Description</h3>
              <p className="mt-1 text-sm text-ink-muted">{product.description}</p>
            </div>
          ) : null}
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold text-ink">Image</h2>
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- storage
              // URL is not a configured next/image remote pattern.
              <img
                src={product.image_url}
                alt={`${product.name} image`}
                className="w-full rounded-[--radius-control] border border-line object-cover"
              />
            ) : (
              <p className="text-sm text-ink-muted">No image uploaded.</p>
            )}
          </section>

          <section className="rounded-xl border border-line bg-canvas/60 p-5">
            <h2 className="text-sm font-semibold text-ink">Stock movements</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Stock history arrives with the Inventory stage. Balances change only
              through auditable movements, never by editing a product.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
