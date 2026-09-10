/**
 * Inventory API shapes.
 *
 * Quantities arrive as DECIMAL strings ("10.000"), never numbers -- see
 * src/lib/money.ts for why. `stock_status` is derived server-side from
 * current and minimum stock and is never stored, so it cannot drift.
 */

import type { Pagination } from "@/features/catalog/types";

export type { Pagination };

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type StockSummary = {
  id: number;
  name: string;
  sku: string;
  unit: string;

  current_stock: string;
  min_stock_level: string;
  stock_status: StockStatus;

  is_active: boolean;

  category: { id: number; name: string } | null;
  brand: { id: number; name: string } | null;
  category_id: number;
  brand_id: number | null;
};

export type StockMovement = {
  id: number;

  type: MovementType;
  type_label: string;
  increases_stock: boolean;

  /** Signed: positive in, negative out. The sign is meaningful; keep it. */
  quantity: string;
  previous_stock: string;
  new_stock: string;

  unit_cost: string | null;
  note: string | null;

  reference_type: string | null;
  reference_id: number | null;
  reference_label: string | null;

  product: { id: number; name: string; sku: string; unit: string } | null;
  product_id: number;

  created_by: { id: number; name: string } | null;

  occurred_at: string | null;
  created_at: string | null;
};

/**
 * Movement types an operator may record.
 *
 * Mirrors StockMovementType::manualTypes() on the backend. invoice_sale and
 * invoice_cancel are deliberately absent: those are written only by the
 * invoice Actions, and the API rejects them here.
 */
export const MANUAL_MOVEMENT_TYPES = [
  {
    value: "opening_stock",
    label: "Opening stock",
    hint: "Starting quantity when you begin tracking this product.",
  },
  { value: "stock_in", label: "Stock in", hint: "New stock received, e.g. a supplier delivery." },
  { value: "stock_out", label: "Stock out", hint: "Stock leaving without a sale, e.g. damage." },
  {
    value: "adjustment_in",
    label: "Adjustment (increase)",
    hint: "Correction after a physical stock count.",
  },
  {
    value: "adjustment_out",
    label: "Adjustment (decrease)",
    hint: "Correction after a physical stock count.",
  },
] as const;

export type ManualMovementType = (typeof MANUAL_MOVEMENT_TYPES)[number]["value"];

/** Every type that can appear in history, including invoice-driven ones. */
export const MOVEMENT_TYPE_FILTERS = [
  ...MANUAL_MOVEMENT_TYPES.map(({ value, label }) => ({ value, label })),
  { value: "invoice_sale", label: "Invoice sale" },
  { value: "invoice_cancel", label: "Invoice cancelled" },
] as const;

export type MovementType = (typeof MOVEMENT_TYPE_FILTERS)[number]["value"];

/** Mirrors App\Support\StockStatus. */
export const STOCK_STATUS_FILTERS = [
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
] as const;

/** Types that decrease stock, used to render the preview and the sign. */
export function movementDecreasesStock(type: ManualMovementType): boolean {
  return type === "stock_out" || type === "adjustment_out";
}

/** The backend requires a note for these; mirrored so the form can say so. */
export function movementRequiresNote(type: ManualMovementType): boolean {
  return type === "stock_out" || type === "adjustment_in" || type === "adjustment_out";
}
