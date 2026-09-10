import { History, ImageOff, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge, StatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, DetailRow } from "@/components/ui/card";
import { EmptyState, PermissionNotice } from "@/components/ui/feedback";
import { BackLink, PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import type { Product } from "@/features/catalog/types";
import { ApiError } from "@/lib/api-error";
import { formatInr, formatPercent, formatQuantity } from "@/lib/money";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Product details" };

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
  // The API omits purchase_price entirely without permission, so the presence
  // of the key is itself the signal -- no separate permission check needed.
  const showCost = product.purchase_price !== undefined;

  const stock = Number.parseFloat(product.current_stock);
  const minStock = Number.parseFloat(product.min_stock_level);
  const stockTone =
    stock <= 0 ? "danger" : Number.isFinite(minStock) && stock <= minStock ? "warning" : "success";
  const stockLabel = stock <= 0 ? "Out of stock" : stockTone === "warning" ? "Low stock" : "In stock";

  return (
    <div className="flex flex-col gap-5">
      <BackLink href="/products">Back to products</BackLink>

      <PageHeader
        title={product.name}
        description={product.model ? `Model ${product.model}` : undefined}
        action={
          <>
            <StatusBadge active={product.is_active} />
            {canUpdate ? (
              <ButtonLink href={`/products/${product.id}/edit`} variant="primary">
                <PencilLine aria-hidden="true" />
                Edit
              </ButtonLink>
            ) : null}
          </>
        }
      />

      {/* Key figures first: what someone opening this page came to read. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Selling price" value={formatInr(product.selling_price)} emphasis />
        {showCost ? (
          <StatTile label="Purchase price" value={formatInr(product.purchase_price)} />
        ) : null}
        <StatTile label="GST rate" value={formatPercent(product.gst_rate)} />
        <StatTile
          label="Current stock"
          value={`${formatQuantity(product.current_stock)} ${product.unit}`}
          badge={<Badge tone={stockTone} size="sm" dot>{stockLabel}</Badge>}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Product information" />
            <CardBody>
              <dl>
                <DetailRow label="SKU" mono>
                  {product.sku}
                </DetailRow>
                <DetailRow label="Category">{product.category?.name ?? "—"}</DetailRow>
                <DetailRow label="Brand">{product.brand?.name ?? "—"}</DetailRow>
                <DetailRow label="Model">{product.model ?? "—"}</DetailRow>
                <DetailRow label="Unit">{product.unit}</DetailRow>
                <DetailRow label="HSN / SAC" mono>
                  {product.hsn_code ?? "—"}
                </DetailRow>
                <DetailRow label="Minimum stock level">
                  {formatQuantity(product.min_stock_level)} {product.unit}
                </DetailRow>
                <DetailRow label="Created">{formatDate(product.created_at)}</DetailRow>
                <DetailRow label="Last updated">{formatDate(product.updated_at)}</DetailRow>
              </dl>
            </CardBody>
          </Card>

          {product.description ? (
            <Card>
              <CardHeader title="Description" />
              <CardBody>
                <p className="whitespace-pre-line text-[0.8125rem] leading-relaxed text-fg-muted">
                  {product.description}
                </p>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Image" />
            <CardBody>
              {product.image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element -- storage
                   URL is not a configured next/image remote pattern. */
                <img
                  src={product.image_url}
                  alt={`${product.name}`}
                  className="w-full rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="py-6">
                  <EmptyState icon={<ImageOff />} title="No image uploaded" />
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Stock movements"
              action={<Badge tone="neutral" size="sm">Coming soon</Badge>}
            />
            <CardBody className="py-8">
              <EmptyState
                icon={<History />}
                title="No movement history yet"
                description="Stock history arrives with the Inventory stage. Balances change only through auditable movements, never by editing a product."
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  badge,
  emphasis = false,
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <p className="text-xs font-medium text-fg-muted">{label}</p>
      <p
        className={
          "num mt-1.5 font-semibold tracking-tight text-fg " +
          (emphasis ? "text-xl" : "text-lg")
        }
      >
        {value}
      </p>
      {badge ? <div className="mt-2">{badge}</div> : null}
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
