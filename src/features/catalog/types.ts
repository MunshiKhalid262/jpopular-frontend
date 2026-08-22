/**
 * Catalog API shapes.
 *
 * Money, GST and quantity arrive as DECIMAL strings, never numbers -- see
 * src/lib/money.ts for why, and for the formatting helpers.
 */

export type CategoryRef = {
  id: number;
  name: string;
  slug: string;
};

export type BrandRef = CategoryRef;

export type Category = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  products_count?: number;
  created_at: string | null;
  updated_at: string | null;
};

export type Brand = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  products_count?: number;
  created_at: string | null;
  updated_at: string | null;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  model: string | null;
  description: string | null;
  unit: string;
  hsn_code: string | null;

  gst_rate: string;
  selling_price: string;
  /**
   * Present ONLY when the caller holds products.view_purchase_price. The API
   * omits the key entirely otherwise, which is why this is optional rather
   * than nullable.
   */
  purchase_price?: string;

  current_stock: string;
  min_stock_level: string;

  is_active: boolean;
  image_url: string | null;

  category: CategoryRef | null;
  brand: BrandRef | null;
  category_id: number;
  brand_id: number | null;

  archived_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Pagination = {
  current_page: number;
  per_page: number;
  total: number | null;
  last_page: number | null;
};

export const PRODUCT_UNITS = [
  { value: "pcs", label: "Piece" },
  { value: "set", label: "Set" },
  { value: "box", label: "Box" },
  { value: "metre", label: "Metre" },
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number]["value"];
