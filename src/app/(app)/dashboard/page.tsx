import {
  ArrowUpRight,
  Boxes,
  ChartNoAxesColumn,
  Package,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import type { Pagination as PaginationMeta } from "@/features/catalog/types";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Dashboard shell.
 *
 * Sales, outstanding payments and low-stock tiles belong to the Inventory and
 * Invoicing stages, and those endpoints do not exist yet. Rather than showing
 * invented numbers, this page reports only counts the catalog API genuinely
 * returns, and marks everything else as a clearly-labelled empty state.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const canSeeProducts = hasPermission(user.permissions, PERMISSIONS.productsView);
  const canSeeCategories = hasPermission(user.permissions, PERMISSIONS.categoriesView);
  const canSeeBrands = hasPermission(user.permissions, PERMISSIONS.brandsView);
  const canSeeUsers = hasPermission(user.permissions, PERMISSIONS.usersView);

  // `per_page=1` because only the pagination total is needed -- this asks the
  // API for a count, not for a page of records.
  const [products, categories, brands, users] = await Promise.all([
    canSeeProducts ? countOf("/products?per_page=1") : null,
    canSeeCategories ? countOf("/categories?per_page=1") : null,
    canSeeBrands ? countOf("/brands?per_page=1") : null,
    canSeeUsers ? countOf("/users?per_page=1") : null,
  ]);

  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

  const stats = [
    { label: "Products", value: products, href: "/products", icon: Package, visible: canSeeProducts },
    { label: "Categories", value: categories, href: "/categories", icon: Tags, visible: canSeeCategories },
    { label: "Brands", value: brands, href: "/brands", icon: Boxes, visible: canSeeBrands },
    { label: "Users", value: users, href: "/users", icon: Users, visible: canSeeUsers },
  ].filter((stat) => stat.visible);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your catalog at a glance. Sales and stock reporting arrive with the Inventory and Invoicing stages."
      />

      {/* --- Counts the API actually provides --------------------------- */}
      {stats.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="group rounded-xl border border-border bg-surface p-4 shadow-xs transition-colors hover:border-border-strong hover:bg-surface-muted"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[0.8125rem] font-medium text-fg-muted">{stat.label}</span>
                  <span
                    aria-hidden="true"
                    className="grid size-7 place-items-center rounded-md bg-surface-inset text-fg-subtle transition-colors group-hover:text-primary-600 [&_svg]:size-3.5"
                  >
                    <Icon />
                  </span>
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <span className="num text-2xl font-semibold tracking-tight text-fg">
                    {stat.value ?? "—"}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-xs text-fg-subtle transition-colors group-hover:text-primary-600">
                    View
                    <ArrowUpRight aria-hidden="true" className="size-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* --- Honest placeholder for reporting ------------------------- */}
        <Card>
          <CardHeader
            title="Sales and stock reporting"
            description="Populated once the Inventory and Invoicing stages are implemented."
            action={<Badge tone="neutral">Not yet available</Badge>}
          />
          <CardBody className="py-12">
            <EmptyState
              icon={<ChartNoAxesColumn />}
              title="No reporting data yet"
              description="Today's sales, outstanding payments, low-stock alerts and recent invoices will appear here. Nothing is shown until the underlying APIs exist — no placeholder figures."
            />
          </CardBody>
        </Card>

        {/* --- Quick links, permission-filtered ------------------------- */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Quick actions" />
            <CardBody className="flex flex-col gap-1 py-2">
              <QuickLink
                href="/products/new"
                label="Add a product"
                visible={hasPermission(user.permissions, PERMISSIONS.productsCreate)}
              />
              <QuickLink
                href="/categories/new"
                label="Add a category"
                visible={hasPermission(user.permissions, PERMISSIONS.categoriesManage)}
              />
              <QuickLink
                href="/brands/new"
                label="Add a brand"
                visible={hasPermission(user.permissions, PERMISSIONS.brandsManage)}
              />
              <QuickLink
                href="/users/new"
                label="Invite a team member"
                visible={hasPermission(user.permissions, PERMISSIONS.usersManage)}
              />
              <QuickLink href="/products" label="Browse the catalog" visible={canSeeProducts} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Your access" description="What this account can do." />
            <CardBody className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="grid size-8 place-items-center rounded-lg bg-primary-50 text-primary-600 [&_svg]:size-4"
                >
                  <ShieldCheck />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium capitalize text-fg">
                    {user.roles.join(", ") || "No role assigned"}
                  </p>
                  <p className="text-xs text-fg-subtle">
                    {user.permissions.length} permissions granted
                  </p>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-fg-subtle">
                Navigation only shows what you can access. Permissions are enforced
                by the server on every request.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  visible,
}: {
  href: string;
  label: string;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-[0.8125rem] text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
    >
      {label}
      <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0 text-fg-subtle" />
    </Link>
  );
}

/**
 * Reads only the pagination total. Returns null on failure so one unavailable
 * count cannot blank the whole dashboard.
 */
async function countOf(path: string): Promise<number | null> {
  try {
    const response = await apiFetch<unknown[]>(path);
    const pagination = response.meta?.pagination as PaginationMeta | undefined;

    return pagination?.total ?? null;
  } catch {
    return null;
  }
}
