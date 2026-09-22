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

/**
 * Who the invoice is for. Orthogonal to TaxType: a dealer or customer invoice
 * can each be GST or non-GST. The type decides the DOCUMENT — a dealer supply
 * moves by road and carries transport details and an e-Way Bill page.
 */
export type InvoiceType = "customer" | "dealer";
export type SupplyType = "intra_state" | "inter_state";
export type PaymentStatus = "unpaid" | "partially_paid" | "paid";

/**
 * A dealer is a customer with a type and a set of dispatch defaults, not a
 * separate entity: invoices already point at customers, and a walk-in who
 * starts buying in bulk should become a dealer without being re-keyed.
 */
export type CustomerType = "customer" | "dealer";

export type Customer = {
  id: number;
  type: CustomerType;
  type_label: string;
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

  /*
   * Dispatch details that repeat on every supply to this dealer. The invoice
   * form copies them in when the dealer is chosen and they stay editable
   * there -- editing them on an invoice never writes back here.
   *
   * The per-trip fields (e-Way Bill, vehicle, LR-RR, order number) are
   * deliberately absent: defaulting them would put last week's lorry on this
   * week's invoice.
   */
  default_consignee_name: string | null;
  default_consignee_address: string | null;
  default_consignee_gstin: string | null;
  default_consignee_state_code: string | null;
  default_dispatched_through: string | null;
  default_destination: string | null;
  default_terms_of_delivery: string | null;
  default_mode_of_payment: string | null;

  archived_at: string | null;
  created_at: string | null;
};

export const CUSTOMER_TYPE_OPTIONS = [
  { value: "customer", label: "Customer" },
  { value: "dealer", label: "Dealer" },
] as const;

/**
 * Dealer default -> the invoice transport field it seeds.
 *
 * One list, used by the dealer form and the invoice form alike, so the two
 * cannot drift apart.
 */
export const DEALER_DEFAULT_FIELDS = [
  { key: "default_consignee_name", target: "consignee_name", label: "Consignee name" },
  { key: "default_consignee_address", target: "consignee_address", label: "Consignee address" },
  { key: "default_consignee_gstin", target: "consignee_gstin", label: "Consignee GSTIN" },
  {
    key: "default_consignee_state_code",
    target: "consignee_state_code",
    label: "Consignee state code",
  },
  { key: "default_dispatched_through", target: "dispatched_through", label: "Dispatched through" },
  { key: "default_destination", target: "destination", label: "Destination" },
  { key: "default_terms_of_delivery", target: "terms_of_delivery", label: "Terms of delivery" },
  { key: "default_mode_of_payment", target: "mode_of_payment", label: "Mode/terms of payment" },
] as const satisfies ReadonlyArray<{ key: keyof Customer; target: string; label: string }>;

/** The dispatch details to copy onto an invoice for this dealer. */
export function dealerInvoiceDefaults(customer: Customer): Record<string, string> {
  const defaults: Record<string, string> = {};

  for (const field of DEALER_DEFAULT_FIELDS) {
    defaults[field.target] = customer[field.key] ?? "";
  }

  return defaults;
}

export type InvoiceItem = {
  id: number;
  product_id: number | null;

  product_name: string;
  sku: string;
  hsn_code: string | null;
  unit: string;

  quantity: string;
  /** The taxable rate every total is built from. */
  unit_price: string;
  /** The price as entered; differs only under tax-inclusive pricing. */
  unit_price_gross: string;
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

export type InvoiceCharge = {
  id: number;
  description: string;
  hsn_code: string | null;
  taxable_amount: string;
  gst_rate: string;
  cgst_rate: string;
  cgst_amount: string;
  sgst_rate: string;
  sgst_amount: string;
  igst_rate: string;
  igst_amount: string;
  tax_amount: string;
  total: string;
  sort_order: number;
};

export type Invoice = {
  id: number;
  invoice_number: string | null;
  financial_year: string | null;
  invoice_date: string | null;

  invoice_type: InvoiceType;
  invoice_type_label: string;
  /** Snapshotted at creation; a historical invoice keeps the mode it used. */
  prices_include_tax: boolean;

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
  charges?: InvoiceCharge[];

  /* Consignee and transport. Present on every invoice for a uniform shape;
     only a dealer invoice fills them in. */
  consignee_name: string | null;
  consignee_address: string | null;
  consignee_gstin: string | null;
  consignee_state_code: string | null;

  eway_bill_no: string | null;
  vehicle_no: string | null;
  dispatched_through: string | null;
  destination: string | null;
  lr_rr_no: string | null;
  lr_rr_date: string | null;
  delivery_note: string | null;
  delivery_note_date: string | null;
  dispatch_doc_no: string | null;
  buyer_order_no: string | null;
  buyer_order_date: string | null;
  terms_of_delivery: string | null;
  mode_of_payment: string | null;
  other_references: string | null;

  /** Typed in from the government portal; never generated by JPopular. */
  irn: string | null;
  ack_no: string | null;
  ack_date: string | null;

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
  /** Dealer invoices run in their own numbered series. */
  dealer_invoice_prefix: string;
  invoice_terms: string | null;
  invoice_declaration: string | null;
  /** Default for NEW invoices only; each invoice snapshots what it used. */
  prices_include_tax: boolean;
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

export const INVOICE_TYPE_OPTIONS = [
  {
    value: "customer",
    label: "Customer invoice",
    hint: "A counter sale. No transport details and no e-Way Bill page.",
  },
  {
    value: "dealer",
    label: "Dealer invoice",
    hint: "Goods moving by road. Carries the transport block and an e-Way Bill page.",
  },
] as const;

export const INVOICE_TYPE_FILTERS = INVOICE_TYPE_OPTIONS.map(({ value, label }) => ({
  value,
  label,
}));

/** Document URLs, all served through this app's BFF proxy. */
export const invoiceDocumentUrls = (invoiceId: number) => ({
  preview: `/api/v1/invoices/${invoiceId}/preview`,
  print: `/api/v1/invoices/${invoiceId}/preview?media=print`,
  download: `/api/v1/invoices/${invoiceId}/pdf`,
  inline: `/api/v1/invoices/${invoiceId}/pdf/inline`,
});
