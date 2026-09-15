/**
 * Dashboard and reporting API shapes.
 *
 * Every money figure arrives as a DECIMAL string computed server-side. The
 * frontend only formats them -- it never sums or re-derives a total, because
 * JavaScript floating point is not a safe place to do financial arithmetic and
 * a second implementation would eventually disagree with the first.
 */

import type { Pagination } from "@/features/catalog/types";

export type { Pagination };

export type PeriodMeta = { from: string; to: string; timezone: string };

/* ------------------------------------------------------------- dashboard */

export type DashboardData = {
  period: { today: PeriodMeta; month: PeriodMeta; timezone: string };

  /** What was INVOICED. Not the same as cash received. */
  sales: {
    today_total: string;
    today_count: number;
    month_total: string;
    month_count: number;
  };

  /** What was actually COLLECTED, plus what is still owed. */
  payments: {
    today_received: string;
    month_received: string;
    outstanding_total: string;
  };

  inventory: {
    total_products: number;
    active_products: number;
    low_stock_count: number;
    out_of_stock_count: number;
  };

  customers: { active_customers: number; total_customers: number };

  tax_split: {
    gst_total: string;
    gst_count: number;
    non_gst_total: string;
    non_gst_count: number;
  };

  sales_trend: Array<{ date: string; label: string; total: string; count: number }>;

  recent_invoices: Array<{
    id: number;
    invoice_number: string | null;
    invoice_date: string | null;
    customer_name: string | null;
    tax_type: "gst" | "non_gst";
    status: "draft" | "finalized" | "cancelled";
    payment_status: "unpaid" | "partially_paid" | "paid";
    grand_total: string;
    due_amount: string;
  }>;

  recent_movements: Array<{
    id: number;
    product_id: number | null;
    product_name: string | null;
    sku: string | null;
    unit: string | null;
    type: string;
    type_label: string;
    increases_stock: boolean;
    quantity: string;
    new_stock: string;
    user_name: string | null;
    occurred_at: string | null;
  }>;

  low_stock_products: Array<{
    id: number;
    name: string;
    sku: string;
    unit: string;
    current_stock: string;
    min_stock_level: string;
    stock_status: "in_stock" | "low_stock" | "out_of_stock";
  }>;
};

/* --------------------------------------------------------------- reports */

export type SalesRow = {
  id: number;
  invoice_date: string | null;
  invoice_number: string | null;
  customer_name: string | null;
  tax_type: "gst" | "non_gst";
  status: string;
  subtotal: string;
  discount_amount: string;
  /** Null on a non-GST bill: there is no tax base to report. */
  taxable_amount: string | null;
  total_tax: string;
  grand_total: string;
  paid_amount: string;
  balance: string;
  payment_status: string;
};

export type SalesSummary = {
  invoice_count: number;
  subtotal: string;
  discount: string;
  taxable: string;
  tax: string;
  grand_total: string;
  paid: string;
  outstanding: string;
};

export type GstRow = {
  id: number;
  invoice_date: string | null;
  invoice_number: string | null;
  customer_name: string | null;
  customer_gstin: string | null;
  supply_type: "intra_state" | "inter_state" | null;
  place_of_supply: string | null;
  taxable_amount: string;
  cgst_amount: string;
  sgst_amount: string;
  igst_amount: string;
  total_tax: string;
  grand_total: string;
  status: string;
};

export type GstSummary = {
  invoice_count: number;
  taxable: string;
  cgst: string;
  sgst: string;
  igst: string;
  total_tax: string;
  grand_total: string;
};

export type NonGstRow = {
  id: number;
  invoice_date: string | null;
  invoice_number: string | null;
  customer_name: string | null;
  subtotal: string;
  discount_amount: string;
  grand_total: string;
  paid_amount: string;
  balance: string;
  payment_status: string;
  status: string;
};

export type NonGstSummary = {
  invoice_count: number;
  subtotal: string;
  discount: string;
  grand_total: string;
  paid: string;
  balance: string;
};

export type PaymentRow = {
  id: number;
  received_at: string | null;
  invoice_id: number;
  invoice_number: string | null;
  customer_name: string | null;
  payment_method: string;
  payment_method_label: string;
  reference: string | null;
  amount: string;
  received_by: string | null;
};

export type PaymentSummary = {
  payment_count: number;
  total_received: string;
  by_method: Array<{ payment_method: string; label: string; count: number; total: string }>;
};

export type OutstandingRow = {
  id: number;
  invoice_number: string | null;
  invoice_date: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  grand_total: string;
  paid_amount: string;
  outstanding: string;
  days_outstanding: number | null;
  payment_status: string;
};

export type OutstandingSummary = {
  invoice_count: number;
  billed: string;
  paid: string;
  outstanding: string;
};

export type InventoryRow = {
  id: number;
  name: string;
  sku: string;
  category_name: string | null;
  brand_name: string | null;
  unit: string;
  current_stock: string;
  min_stock_level: string;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  is_active: boolean;
};

export type InventorySummary = {
  product_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
};

export type MovementRow = {
  id: number;
  occurred_at: string | null;
  product_id: number | null;
  product_name: string | null;
  sku: string | null;
  unit: string | null;
  type: string;
  type_label: string;
  increases_stock: boolean;
  quantity: string;
  previous_stock: string;
  new_stock: string;
  reference_label: string | null;
  note: string | null;
  user_name: string | null;
};

/** The reports, for navigation and the index page. */
export const REPORTS = [
  {
    href: "/reports/sales",
    title: "Sales",
    description: "Every invoice raised in the period, with totals.",
    permission: "reports.sales",
  },
  {
    href: "/reports/gst",
    title: "GST sales",
    description: "GST invoices with CGST, SGST and IGST broken out.",
    permission: "reports.gst",
  },
  {
    href: "/reports/non-gst",
    title: "Non-GST sales",
    description: "Bills raised without GST. No tax columns.",
    permission: "reports.sales",
  },
  {
    href: "/reports/payments",
    title: "Payments",
    description: "Cash actually collected, split by method.",
    permission: "reports.payments",
  },
  {
    href: "/reports/outstanding",
    title: "Outstanding",
    description: "Invoices still owing money, oldest first.",
    permission: "reports.payments",
  },
  {
    href: "/reports/inventory",
    title: "Inventory",
    description: "Stock on hand, with low and out-of-stock filters.",
    permission: "reports.inventory",
  },
  {
    href: "/reports/stock-movements",
    title: "Stock movements",
    description: "The stock ledger over a date range.",
    permission: "reports.stock",
  },
] as const;
