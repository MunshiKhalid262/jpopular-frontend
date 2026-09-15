/**
 * Permission constants, mirroring App\Enums\PermissionName on the backend.
 *
 * Components must ask "can this user do X?" via these keys, never
 * `role === "admin"`. Adding a third role then requires no component changes.
 *
 * These checks drive navigation and button visibility only -- every one of them
 * is re-enforced by a Laravel Policy.
 */
export const PERMISSIONS = {
  dashboardView: "dashboard.view",

  categoriesView: "categories.view",
  categoriesManage: "categories.manage",
  brandsView: "brands.view",
  brandsManage: "brands.manage",
  productsView: "products.view",
  productsCreate: "products.create",
  productsUpdate: "products.update",
  productsDelete: "products.delete",
  productsViewPurchasePrice: "products.view_purchase_price",

  inventoryView: "inventory.view",
  inventoryAdjust: "inventory.adjust",
  inventoryPurchase: "inventory.purchase",

  customersView: "customers.view",
  customersManage: "customers.manage",
  customersDelete: "customers.delete",

  invoicesView: "invoices.view",
  invoicesCreate: "invoices.create",
  invoicesUpdate: "invoices.update",
  invoicesFinalize: "invoices.finalize",
  invoicesCancel: "invoices.cancel",
  invoicesDelete: "invoices.delete",
  invoicesPrint: "invoices.print",

  paymentsView: "payments.view",
  paymentsRecord: "payments.record",
  paymentsVoid: "payments.void",

  reportsView: "reports.view",
  reportsSales: "reports.sales",
  reportsProductWise: "reports.product_wise",
  reportsStock: "reports.stock",
  reportsGst: "reports.gst",
  reportsPayments: "reports.payments",
  reportsInventory: "reports.inventory",
  reportsExport: "reports.export",

  usersView: "users.view",
  usersManage: "users.manage",
  rolesView: "roles.view",
  rolesManage: "roles.manage",
  settingsView: "settings.view",
  settingsUpdate: "settings.update",
  auditView: "audit.view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function hasPermission(
  granted: readonly string[],
  permission: Permission,
): boolean {
  return granted.includes(permission);
}

export function hasAnyPermission(
  granted: readonly string[],
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => granted.includes(permission));
}
