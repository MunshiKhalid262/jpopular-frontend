import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  FileText,
  History,
  IndianRupee,
  Package,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, ErrorNotice, PermissionNotice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { CodeText } from "@/components/ui/table";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { SalesTrendChart } from "@/features/reporting/components/SalesTrendChart";
import { StatCard } from "@/features/reporting/components/StatCard";
import type { DashboardData } from "@/features/reporting/types";
import { ApiError } from "@/lib/api-error";
import { formatInr, formatQuantity } from "@/lib/money";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Dashboard" };

function formatDate(value: string | null): string {
  if (!value) return "—";

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.dashboardView)) {
    return <PermissionNotice>You do not have permission to view the dashboard.</PermissionNotice>;
  }

  const canSeeInvoices = hasPermission(user.permissions, PERMISSIONS.invoicesView);
  const canSeeInventory = hasPermission(user.permissions, PERMISSIONS.inventoryView);
  const canSeeReports = hasPermission(user.permissions, PERMISSIONS.reportsView);

  let data: DashboardData;

  try {
    data = (await apiFetch<DashboardData>("/dashboard")).data;
  } catch (error) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Dashboard" />
        <ErrorNotice>
          {error instanceof ApiError ? error.message : "Could not load the dashboard."}
        </ErrorNotice>
      </div>
    );
  }

  const { sales, payments, inventory, customers, tax_split: tax } = data;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Dashboard"
        description={`Today and month to date, in ${data.period.timezone.replace("_", " ")}.`}
        action={
          canSeeReports ? (
            <ButtonLink href="/reports" variant="secondary">
              <TrendingUp aria-hidden="true" />
              Reports
            </ButtonLink>
          ) : null
        }
      />

      {/* ------------------------------------------------------- top cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Today's sales"
          value={formatInr(sales.today_total)}
          hint={`${sales.today_count} invoice${sales.today_count === 1 ? "" : "s"}`}
          icon={IndianRupee}
        />
        <StatCard
          label="This month"
          value={formatInr(sales.month_total)}
          hint={`${sales.month_count} invoice${sales.month_count === 1 ? "" : "s"}`}
          icon={TrendingUp}
        />
        {/*
          Payments received is deliberately its own card next to sales: they
          are different numbers, and showing only one of them is how a shop
          convinces itself it has money it has not collected.
        */}
        <StatCard
          label="Payments received"
          value={formatInr(payments.today_received)}
          hint={`${formatInr(payments.month_received)} this month`}
          icon={Wallet}
        />
        <StatCard
          label="Outstanding"
          value={formatInr(payments.outstanding_total)}
          hint="Owed across all unpaid invoices"
          icon={AlertTriangle}
          tone={payments.outstanding_total === "0.00" ? "neutral" : "warning"}
          href={canSeeReports ? "/reports/outstanding" : undefined}
        />
        <StatCard
          label="Low stock"
          value={String(inventory.low_stock_count)}
          hint={`${inventory.out_of_stock_count} out of stock`}
          icon={Boxes}
          tone={inventory.low_stock_count > 0 ? "warning" : "neutral"}
          href={canSeeInventory ? "/inventory?low_stock=1" : undefined}
        />
        <StatCard
          label="Products"
          value={String(inventory.active_products)}
          hint={`${customers.active_customers} active customers`}
          icon={Package}
        />
      </div>

      {/* ------------------------------------------- trend + tax split */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">Sales, last 7 days</h2>
            <span className="text-xs text-fg-subtle">Finalized invoices</span>
          </div>
          <SalesTrendChart series={data.sales_trend} />
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-fg">This month by type</h2>
          <dl className="flex flex-col gap-3">
            <div>
              <dt className="flex items-center justify-between text-[0.8125rem] text-fg-muted">
                <span>GST invoices</span>
                <span className="text-xs text-fg-subtle">{tax.gst_count}</span>
              </dt>
              <dd className="num text-base font-semibold text-fg">{formatInr(tax.gst_total)}</dd>
            </div>
            <div className="border-t border-border pt-3">
              <dt className="flex items-center justify-between text-[0.8125rem] text-fg-muted">
                <span>Non-GST invoices</span>
                <span className="text-xs text-fg-subtle">{tax.non_gst_count}</span>
              </dt>
              <dd className="num text-base font-semibold text-fg">
                {formatInr(tax.non_gst_total)}
              </dd>
            </div>
            <div className="border-t border-border pt-3">
              <dt className="text-[0.8125rem] text-fg-muted">Month total</dt>
              <dd className="num text-base font-semibold text-fg">
                {formatInr(sales.month_total)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* ------------------------------------- invoices + low stock */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">Recent invoices</h2>
            {canSeeInvoices ? (
              <Link
                href="/invoices"
                className="flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
              >
                All invoices
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            ) : null}
          </div>

          {data.recent_invoices.length === 0 ? (
            <EmptyState
              icon={<FileText />}
              title="No invoices yet"
              description="Raise your first invoice and it will appear here."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {data.recent_invoices.map((invoice) => (
                <li key={invoice.id} className="flex items-center gap-3 py-2 first:pt-0">
                  <div className="min-w-0 flex-1">
                    {canSeeInvoices ? (
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="text-[0.8125rem] font-medium text-fg hover:underline"
                      >
                        {invoice.invoice_number ?? `#${invoice.id}`}
                      </Link>
                    ) : (
                      <span className="text-[0.8125rem] font-medium text-fg">
                        {invoice.invoice_number ?? `#${invoice.id}`}
                      </span>
                    )}
                    <p className="truncate text-xs text-fg-muted">
                      {invoice.customer_name ?? "Walk-in"} · {formatDate(invoice.invoice_date)}
                    </p>
                  </div>

                  <Badge tone={invoice.tax_type === "gst" ? "info" : "neutral"} size="sm">
                    {invoice.tax_type === "gst" ? "GST" : "Non-GST"}
                  </Badge>

                  <Badge
                    tone={
                      invoice.status === "cancelled"
                        ? "danger"
                        : invoice.payment_status === "paid"
                          ? "success"
                          : invoice.payment_status === "partially_paid"
                            ? "warning"
                            : "neutral"
                    }
                    size="sm"
                  >
                    {invoice.status === "cancelled"
                      ? "Cancelled"
                      : invoice.payment_status === "paid"
                        ? "Paid"
                        : invoice.payment_status === "partially_paid"
                          ? "Part paid"
                          : "Unpaid"}
                  </Badge>

                  <span className="num w-24 shrink-0 text-right text-[0.8125rem] font-medium text-fg">
                    {formatInr(invoice.grand_total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-fg">Needs restocking</h2>
            {canSeeInventory ? (
              <Link
                href="/inventory?low_stock=1"
                className="flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
              >
                Inventory
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            ) : null}
          </div>

          {data.low_stock_products.length === 0 ? (
            <EmptyState
              icon={<Boxes />}
              title="Nothing to restock"
              description="Every product is above its minimum stock level."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {data.low_stock_products.map((product) => (
                <li key={product.id} className="flex items-center gap-2 py-2 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8125rem] font-medium text-fg">{product.name}</p>
                    <p className="text-xs text-fg-subtle">
                      <CodeText>{product.sku}</CodeText>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={
                        "num text-[0.8125rem] font-semibold " +
                        (product.stock_status === "out_of_stock"
                          ? "text-danger-700"
                          : "text-warning-700")
                      }
                    >
                      {formatQuantity(product.current_stock)} {product.unit}
                    </p>
                    <p className="text-xs text-fg-subtle">
                      min {formatQuantity(product.min_stock_level)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ------------------------------------------- stock movements */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">Recent stock movements</h2>
          {canSeeInventory ? (
            <Link
              href="/inventory/movements"
              className="flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
            >
              All movements
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </Link>
          ) : null}
        </div>

        {data.recent_movements.length === 0 ? (
          <EmptyState
            icon={<History />}
            title="No stock movements yet"
            description="Opening stock, purchases and sales will appear here."
          />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {data.recent_movements.map((movement) => (
              <li key={movement.id} className="flex items-center gap-3 py-2 first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8125rem] font-medium text-fg">
                    {movement.product_name ?? "—"}
                  </p>
                  <p className="truncate text-xs text-fg-muted">
                    {movement.type_label}
                    {movement.user_name ? ` · ${movement.user_name}` : ""}
                  </p>
                </div>

                <span
                  className={
                    "num shrink-0 text-[0.8125rem] font-medium " +
                    (movement.increases_stock ? "text-fg" : "text-warning-700")
                  }
                >
                  {movement.increases_stock ? "+" : ""}
                  {formatQuantity(movement.quantity)}
                </span>

                <span className="num w-20 shrink-0 text-right text-xs text-fg-subtle">
                  → {formatQuantity(movement.new_stock)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
