/**
 * Sales API shapes.
 *
 * Money and quantities arrive as DECIMAL strings, never numbers -- see
 * src/lib/money.ts for why.
 *
 * Every invoice line is a SNAPSHOT taken when the invoice was created: the
 * product name, SKU, HSN, price and GST rate are stored on the line itself, so
 * a later catalog change cannot alter a historical invoice.
 */

import type { Pagination } from "@/features/catalog/types";

export type { Pagination };

export type InvoiceStatus = "draft" | "finalized" | "cancelled";
export type TaxType = "gst" | "non_gst";
export type SupplyType = "intra_state" | "inter_state";
export type PaymentStatus = "unpaid" | "partially_paid" | "paid";

export type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  state_code: string | null;
  pincode: string | null;
  gstin: string | null;
  notes: string | null;
  is_active: boolean;
  /** False when the customer has no state code, which a GST invoice requires. */
  can_be_billed_with_gst: boolean;
  archived_at: string | null;
  created_at: string | null;
};

export type InvoiceItem = {
  id: number;
  product_id: number | null;

  product_name: string;
  sku: string;
  hsn_code: string | null;
  unit: string;

  quantity: string;
  unit_price: string;
  gst_rate: string;

  line_subtotal: string;
  discount_amount: string;
  taxable_amount: string;

  cgst_rate: string;
  cgst_amount: string;
  sgst_rate: string;
  sgst_amount: string;
  igst_rate: string;
  igst_amount: string;

  tax_amount: string;
  line_total: string;
  sort_order: number;
};

export type Invoice = {
  id: number;
  invoice_number: string | null;
  financial_year: string | null;
  invoice_date: string | null;

  tax_type: TaxType;
  tax_type_label: string;
  status: InvoiceStatus;
  payment_status: PaymentStatus;
  supply_type: SupplyType | null;

  subtotal: string;
  discount_amount: string;
  taxable_amount: string;
  cgst_amount: string;
  sgst_amount: string;
  igst_amount: string;
  total_tax: string;
  round_off: string;
  grand_total: string;
  paid_amount: string;
  due_amount: string;

  notes: string | null;
  terms: string | null;

  customer: {
    id: number;
    name: string;
    phone: string | null;
    gstin: string | null;
    state_code: string | null;
  } | null;
  customer_id: number | null;

  items?: InvoiceItem[];

  cancellation_reason: string | null;
  finalized_at: string | null;
  cancelled_at: string | null;
  created_at: string | null;
};

export type BusinessSettings = {
  business_name: string;
  legal_name: string | null;
  gstin: string | null;
  pan: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  state_code: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  invoice_prefix: string;
  invoice_terms: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_branch: string | null;
  upi_id: string | null;
  default_gst_rate: string;
  enable_round_off: boolean;
  financial_year_start_month: number;
  /** False until a seller state code is set; GST invoicing is blocked. */
  can_issue_gst_invoices: boolean;
};

export const INVOICE_STATUS_FILTERS = [
  { value: "draft", label: "Draft" },
  { value: "finalized", label: "Finalized" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const TAX_TYPE_OPTIONS = [
  { value: "gst", label: "GST invoice" },
  { value: "non_gst", label: "Non-GST invoice" },
] as const;

/** Document URLs, all served through this app's BFF proxy. */
export const invoiceDocumentUrls = (invoiceId: number) => ({
  preview: `/api/v1/invoices/${invoiceId}/preview`,
  print: `/api/v1/invoices/${invoiceId}/preview?media=print`,
  download: `/api/v1/invoices/${invoiceId}/pdf`,
  inline: `/api/v1/invoices/${invoiceId}/pdf/inline`,
});
