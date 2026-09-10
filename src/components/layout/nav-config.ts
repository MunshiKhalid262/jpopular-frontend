import {
  Boxes,
  History,
  LayoutDashboard,
  Package,
  Tags,
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
    heading: "Administration",
    items: [
      {
        href: "/users",
        label: "Users",
        icon: Users,
        permission: PERMISSIONS.usersView,
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

  [/^\/users$/, { title: "Users" }],
  [/^\/users\/new$/, { title: "Add user", parent: "/users" }],
  [/^\/users\/[^/]+\/edit$/, { title: "Edit user", parent: "/users" }],
];

const SECTION_LABELS: Record<string, string> = {
  "/products": "Products",
  "/categories": "Categories",
  "/brands": "Brands",
  "/inventory": "Stock",
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
