import {
  Boxes,
  Building2,
  FileText,
  History,
  LayoutDashboard,
  Package,
  Tags,
  TrendingUp,
  Truck,
  UserRound,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import { PERMISSIONS, type Permission } from "@/features/auth/permissions";
import type { Crumb } from "@/components/ui/page-header";

/**
 * Single source of truth for navigation.
 *
 * The sidebar renders from this, and the top bar derives its title and
 * breadcrumbs from it, so the two can never disagree about what a page is
 * called.
 *
 * Only shipped modules appear here. Invoicing, customers, payments and reports
 * are deliberately absent until those slices exist -- a nav item that leads
 * nowhere is worse than no nav item.
 */

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  /** Extra path prefixes that should light this item up. */
  matches?: string[];
};

export type NavGroup = {
  /** null renders the group without a heading (used for Dashboard). */
  heading: string | null;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    heading: null,
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        permission: PERMISSIONS.dashboardView,
      },
    ],
  },
  {
    heading: "Catalog",
    items: [
      {
        href: "/products",
        label: "Products",
        icon: Package,
        permission: PERMISSIONS.productsView,
      },
      {
        href: "/categories",
        label: "Categories",
        icon: Tags,
        permission: PERMISSIONS.categoriesView,
      },
      {
        href: "/brands",
        label: "Brands",
        icon: Boxes,
        permission: PERMISSIONS.brandsView,
      },
    ],
  },
  {
    heading: "Inventory",
    items: [
      {
        href: "/inventory",
        label: "Stock",
        icon: Warehouse,
        permission: PERMISSIONS.inventoryView,
      },
      {
        href: "/inventory/movements",
        label: "Movements",
        icon: History,
        permission: PERMISSIONS.inventoryView,
      },
    ],
  },
  {
    heading: "Sales",
    items: [
      {
        href: "/invoices",
        label: "Invoices",
        icon: FileText,
        permission: PERMISSIONS.invoicesView,
      },
      {
        href: "/customers",
        label: "Customers",
        icon: UserRound,
        permission: PERMISSIONS.customersView,
      },
      {
        href: "/dealers",
        label: "Dealers",
        icon: Truck,
        permission: PERMISSIONS.customersView,
      },
    ],
  },
  {
    heading: "Insights",
    items: [
      {
        href: "/reports",
        label: "Reports",
        icon: TrendingUp,
        permission: PERMISSIONS.reportsView,
      },
    ],
  },
  {
    heading: "Administration",
    items: [
      {
        href: "/users",
        label: "Users",
        icon: Users,
        permission: PERMISSIONS.usersView,
      },
      {
        href: "/settings",
        label: "Settings",
        icon: Building2,
        permission: PERMISSIONS.settingsView,
      },
    ],
  },
];

function prefixesOf(item: NavItem): string[] {
  return [item.href, ...(item.matches ?? [])];
}

function matches(prefix: string, pathname: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * True when `pathname` is the item's page or a page beneath it, and no MORE
 * SPECIFIC item also claims it.
 *
 * The specificity check is what stops two items lighting up at once:
 * `/inventory` is a prefix of `/inventory/movements`, so a plain
 * startsWith would highlight Stock and Movements together. The longest
 * matching prefix across the whole nav wins, which keeps this correct for any
 * nested route added later without needing per-item flags.
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  const own = prefixesOf(item).filter((prefix) => matches(prefix, pathname));

  if (own.length === 0) {
    return false;
  }

  const longestOwn = Math.max(...own.map((prefix) => prefix.length));

  const longestAnywhere = NAV_GROUPS.flatMap((group) => group.items)
    .flatMap(prefixesOf)
    .filter((prefix) => matches(prefix, pathname))
    .reduce((longest, prefix) => Math.max(longest, prefix.length), 0);

  return longestOwn === longestAnywhere;
}

/* ------------------------------------------------------------------ titles */

type RouteMeta = { title: string; parent?: string };

/**
 * Route metadata for the top bar. Keys are matched most-specific-first, with
 * `[id]` standing in for any single segment.
 */
const ROUTE_META: Array<[RegExp, RouteMeta]> = [
  [/^\/dashboard$/, { title: "Dashboard" }],

  [/^\/products$/, { title: "Products" }],
  [/^\/products\/new$/, { title: "Add product", parent: "/products" }],
  [/^\/products\/[^/]+\/edit$/, { title: "Edit product", parent: "/products" }],
  [/^\/products\/[^/]+$/, { title: "Product details", parent: "/products" }],

  [/^\/categories$/, { title: "Categories" }],
  [/^\/categories\/new$/, { title: "Add category", parent: "/categories" }],
  [/^\/categories\/[^/]+\/edit$/, { title: "Edit category", parent: "/categories" }],

  [/^\/brands$/, { title: "Brands" }],
  [/^\/brands\/new$/, { title: "Add brand", parent: "/brands" }],
  [/^\/brands\/[^/]+\/edit$/, { title: "Edit brand", parent: "/brands" }],

  // Most specific first: /inventory would otherwise swallow its own subpage.
  [/^\/inventory\/movements$/, { title: "Stock movements", parent: "/inventory" }],
  [/^\/inventory$/, { title: "Stock" }],

  [/^\/invoices$/, { title: "Invoices" }],
  [/^\/invoices\/new$/, { title: "New invoice", parent: "/invoices" }],
  [/^\/invoices\/[^/]+\/edit$/, { title: "Edit invoice", parent: "/invoices" }],
  [/^\/invoices\/[^/]+\/preview$/, { title: "Invoice preview", parent: "/invoices" }],
  [/^\/invoices\/[^/]+$/, { title: "Invoice", parent: "/invoices" }],

  [/^\/customers$/, { title: "Customers" }],
  [/^\/customers\/new$/, { title: "Add customer", parent: "/customers" }],
  [/^\/customers\/[^/]+\/edit$/, { title: "Edit customer", parent: "/customers" }],

  [/^\/dealers$/, { title: "Dealers" }],
  [/^\/dealers\/new$/, { title: "Add dealer", parent: "/dealers" }],
  [/^\/dealers\/[^/]+\/edit$/, { title: "Edit dealer", parent: "/dealers" }],

  // Most specific first: /reports would otherwise swallow its own subpages.
  [/^\/reports\/sales$/, { title: "Sales report", parent: "/reports" }],
  [/^\/reports\/gst$/, { title: "GST sales report", parent: "/reports" }],
  [/^\/reports\/non-gst$/, { title: "Non-GST sales report", parent: "/reports" }],
  [/^\/reports\/payments$/, { title: "Payment report", parent: "/reports" }],
  [/^\/reports\/outstanding$/, { title: "Outstanding", parent: "/reports" }],
  [/^\/reports\/inventory$/, { title: "Inventory report", parent: "/reports" }],
  [/^\/reports\/stock-movements$/, { title: "Stock movement report", parent: "/reports" }],
  [/^\/reports$/, { title: "Reports" }],

  [/^\/settings$/, { title: "Business settings" }],

  [/^\/users$/, { title: "Users" }],
  [/^\/users\/new$/, { title: "Add user", parent: "/users" }],
  [/^\/users\/[^/]+\/edit$/, { title: "Edit user", parent: "/users" }],
];

const SECTION_LABELS: Record<string, string> = {
  "/products": "Products",
  "/categories": "Categories",
  "/brands": "Brands",
  "/inventory": "Stock",
  "/invoices": "Invoices",
  "/customers": "Customers",
  "/dealers": "Dealers",
  "/reports": "Reports",
  "/settings": "Settings",
  "/users": "Users",
  "/dashboard": "Dashboard",
};

export function getRouteTitle(pathname: string): string {
  const match = ROUTE_META.find(([pattern]) => pattern.test(pathname));

  return match?.[1].title ?? "JPopular";
}

/**
 * Breadcrumbs for the current route. Returns an empty array for a top-level
 * page, where a single crumb repeating the page title would be noise.
 */
export function getRouteCrumbs(pathname: string): Crumb[] {
  const match = ROUTE_META.find(([pattern]) => pattern.test(pathname));

  if (!match) {
    return [];
  }

  const { title, parent } = match[1];

  if (!parent) {
    return [];
  }

  return [
    { label: SECTION_LABELS[parent] ?? parent.replace("/", ""), href: parent },
    { label: title },
  ];
}
