"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormActions, FormSection } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/feedback";
import { Input, Select, Textarea } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { postJson, putJson } from "@/features/catalog/client";
import type { Product } from "@/features/catalog/types";
import { lineAmount, sumAmounts } from "@/features/invoicing/invoice-math";
import type { Customer, Invoice, InvoiceType } from "@/features/invoicing/types";
import { INVOICE_TYPE_OPTIONS, TAX_TYPE_OPTIONS } from "@/features/invoicing/types";
import { formatInr } from "@/lib/money";

type Line = {
  key: string;
  product_id: string;
  quantity: string;
  unit_price: string;
};

type Charge = {
  key: string;
  description: string;
  amount: string;
  gst_rate: string;
  hsn_code: string;
};

let lineKey = 0;
const nextKey = () => `line-${lineKey++}`;

function emptyLine(): Line {
  return { key: nextKey(), product_id: "", quantity: "1", unit_price: "" };
}

function emptyCharge(): Charge {
  return { key: nextKey(), description: "", amount: "", gst_rate: "18", hsn_code: "" };
}

/** Transport fields, rendered only for a dealer invoice. */
const TRANSPORT_FIELDS = [
  { name: "eway_bill_no", label: "e-Way Bill No.", hint: "From the government portal." },
  { name: "vehicle_no", label: "Motor Vehicle No." },
  { name: "dispatched_through", label: "Dispatched through", placeholder: "BY ROAD" },
  { name: "destination", label: "Destination" },
  { name: "lr_rr_no", label: "Bill of Lading / LR-RR No." },
  { name: "delivery_note", label: "Delivery Note" },
  { name: "dispatch_doc_no", label: "Dispatch Doc No." },
  { name: "buyer_order_no", label: "Buyer's Order No." },
  { name: "terms_of_delivery", label: "Terms of Delivery" },
  { name: "mode_of_payment", label: "Mode/Terms of Payment" },
  { name: "other_references", label: "Other References" },
] as const;

/**
 * Create or edit a DRAFT invoice.
 *
 * The totals shown here are an estimate for the operator's benefit. The server
 * recomputes everything through the tax engine on save, and its figures are
 * authoritative -- GST apportionment and per-line rounding are not
 * reimplemented in the browser, because two implementations of that would
 * eventually disagree by a paisa.
 */
export function InvoiceForm({
  invoice,
  products,
  customers,
  canIssueGst,
}: {
  invoice?: Invoice;
  products: Product[];
  customers: Customer[];
  canIssueGst: boolean;
}) {
  const router = useRouter();
  const editing = Boolean(invoice);

  const [customerId, setCustomerId] = useState(invoice?.customer_id?.toString() ?? "");
  const [invoiceType, setInvoiceType] = useState<InvoiceType>(invoice?.invoice_type ?? "customer");
  const [taxType, setTaxType] = useState(invoice?.tax_type ?? (canIssueGst ? "gst" : "non_gst"));

  // Consignee and transport, kept as one bag since they move together and are
  // only meaningful on a dealer invoice.
  const [transport, setTransport] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};

    for (const field of TRANSPORT_FIELDS) {
      seed[field.name] = (invoice?.[field.name as keyof Invoice] as string | null) ?? "";
    }

    seed.consignee_name = invoice?.consignee_name ?? "";
    seed.consignee_address = invoice?.consignee_address ?? "";
    seed.consignee_gstin = invoice?.consignee_gstin ?? "";
    seed.consignee_state_code = invoice?.consignee_state_code ?? "";
    seed.irn = invoice?.irn ?? "";
    seed.ack_no = invoice?.ack_no ?? "";

    return seed;
  });

  const [charges, setCharges] = useState<Charge[]>(
    invoice?.charges?.length
      ? invoice.charges.map((charge) => ({
          key: nextKey(),
          description: charge.description,
          amount: charge.taxable_amount,
          gst_rate: charge.gst_rate,
          hsn_code: charge.hsn_code ?? "",
        }))
      : [],
  );
  const [invoiceDate, setInvoiceDate] = useState(
    invoice?.invoice_date ?? new Date().toISOString().slice(0, 10),
  );
  const [discount, setDiscount] = useState(
    invoice && invoice.discount_amount !== "0.00" ? invoice.discount_amount : "",
  );
  const [notes, setNotes] = useState(invoice?.notes ?? "");

  const [lines, setLines] = useState<Line[]>(
    invoice?.items?.length
      ? invoice.items.map((item) => ({
          key: nextKey(),
          product_id: item.product_id?.toString() ?? "",
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))
      : [emptyLine()],
  );

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const productById = new Map(products.map((product) => [String(product.id), product]));
  const selectedCustomer = customers.find((c) => String(c.id) === customerId);

  const gst = taxType === "gst";
  // A GST invoice cannot be finalized without both state codes, so the form
  // warns before the operator builds one that will be refused.
  const gstBlocked =
    gst && (!canIssueGst || (customerId !== "" && selectedCustomer?.can_be_billed_with_gst === false));

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  /*
   * These take a plain VALUE, never the event.
   *
   * A functional state updater is not run during the event handler -- React
   * calls it later, while re-rendering. By then the synthetic event has been
   * cleaned up and `event.currentTarget` is null, so reading `.value` inside
   * the updater throws and takes the whole page down to the error boundary.
   * Reading it synchronously in the handler and passing the string in is the
   * fix, and is what updateLine above has always done.
   */
  function updateTransport(name: string, value: string) {
    setTransport((current) => ({ ...current, [name]: value }));
  }

  function updateCharge(key: string, patch: Partial<Charge>) {
    setCharges((current) =>
      current.map((charge) => (charge.key === key ? { ...charge, ...patch } : charge)),
    );
  }

  function chooseProduct(key: string, productId: string) {
    const product = productById.get(productId);

    updateLine(key, {
      product_id: productId,
      // Default to the catalog price; the operator may override per line.
      unit_price: product ? product.selling_price : "",
    });
  }

  const subtotal = sumAmounts(
    lines.map((line) => lineAmount(line.quantity, line.unit_price) ?? "0.00"),
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setPending(true);
    setFormError(null);
    setFieldErrors({});

    // Transport fields are only sent for a dealer invoice, so switching a
    // draft back to customer does not leave stale dispatch details behind.
    const transportPayload =
      invoiceType === "dealer"
        ? Object.fromEntries(
            Object.entries(transport).map(([key, value]) => [
              key,
              value.trim() === "" ? null : value.trim(),
            ]),
          )
        : {};

    const payload = {
      customer_id: customerId === "" ? null : Number(customerId),
      invoice_type: invoiceType,
      tax_type: taxType,
      invoice_date: invoiceDate,
      discount_amount: discount.trim() === "" ? null : discount.trim(),
      notes: notes.trim() === "" ? null : notes.trim(),
      ...transportPayload,
      charges: charges
        .filter((charge) => charge.description.trim() !== "" && charge.amount.trim() !== "")
        .map((charge) => ({
          description: charge.description.trim(),
          amount: charge.amount.trim(),
          gst_rate: charge.gst_rate.trim() === "" ? null : charge.gst_rate.trim(),
          hsn_code: charge.hsn_code.trim() === "" ? null : charge.hsn_code.trim(),
        })),
      lines: lines
        .filter((line) => line.product_id !== "")
        .map((line) => ({
          product_id: Number(line.product_id),
          quantity: line.quantity,
          unit_price: line.unit_price === "" ? null : line.unit_price,
        })),
    };

    const result = editing
      ? await putJson<Invoice>(`/invoices/${invoice!.id}`, payload)
      : await postJson<Invoice>("/invoices", payload);

    setPending(false);

    if (!result.ok) {
      setFieldErrors(result.failure.errors);

      if (Object.keys(result.failure.errors).length === 0) {
        setFormError(result.failure.message);
      } else {
        // Line errors are keyed "lines.0.quantity" and cannot render against a
        // single field, so a summary points at the problem.
        setFormError("Some lines need attention. Check the highlighted fields.");
      }

      return;
    }

    notify.success(editing ? "Draft updated" : "Draft invoice created", {
      description: "Finalize it when you are ready to issue it.",
    });

    router.push(`/invoices/${result.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {formError ? <FormAlert message={formError} /> : null}

      {gstBlocked ? (
        <div className="rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-[0.8125rem] leading-relaxed text-warning-700">
          {!canIssueGst ? (
            <>
              Your business has no GST state code set, so a GST invoice cannot be finalized. Add it
              in <span className="font-medium">Settings</span>, or raise this as a non-GST invoice.
            </>
          ) : (
            <>
              This customer has no state code, so the CGST/SGST vs IGST split cannot be determined.
              Add their state, or raise this as a non-GST invoice.
            </>
          )}
        </div>
      ) : null}

      <FormSection title="Invoice" description="Who it is for and how it is taxed.">
        <Field
          label="Invoice type"
          required
          hint={INVOICE_TYPE_OPTIONS.find((o) => o.value === invoiceType)?.hint}
          error={fieldErrors.invoice_type?.[0]}
        >
          {(props) => (
            <Select
              {...props}
              value={invoiceType}
              onChange={(event) => setInvoiceType(event.currentTarget.value as InvoiceType)}
              disabled={pending}
            >
              {INVOICE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Customer" hint="Leave empty for a walk-in counter sale.">
          {(props) => (
            <Select
              {...props}
              value={customerId}
              onChange={(event) => setCustomerId(event.currentTarget.value)}
              disabled={pending}
            >
              <option value="">Walk-in customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.phone ? ` · ${customer.phone}` : ""}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Invoice type" required error={fieldErrors.tax_type?.[0]}>
          {(props) => (
            <Select
              {...props}
              value={taxType}
              onChange={(event) =>
                setTaxType(event.currentTarget.value as "gst" | "non_gst")
              }
              disabled={pending}
            >
              {TAX_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Invoice date" required error={fieldErrors.invoice_date?.[0]}>
          {(props) => (
            <Input
              {...props}
              type="date"
              value={invoiceDate}
              onChange={(event) => setInvoiceDate(event.currentTarget.value)}
              disabled={pending}
            />
          )}
        </Field>
      </FormSection>

      {/* ------------------------------------------------------------- lines */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">Items</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setLines((current) => [...current, emptyLine()])}
            disabled={pending}
          >
            <Plus aria-hidden="true" />
            Add line
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {lines.map((line, index) => {
            const product = productById.get(line.product_id);
            const amount = lineAmount(line.quantity, line.unit_price);

            return (
              <div
                key={line.key}
                className="grid gap-2 rounded-lg border border-border bg-surface-muted p-3 md:grid-cols-[minmax(0,1fr)_7rem_8rem_8rem_2.5rem] md:items-end"
              >
                <Field
                  label={index === 0 ? "Product" : ""}
                  error={fieldErrors[`lines.${index}.product_id`]?.[0]}
                >
                  {(props) => (
                    <Select
                      {...props}
                      value={line.product_id}
                      onChange={(event) => chooseProduct(line.key, event.currentTarget.value)}
                      disabled={pending}
                    >
                      <option value="">Choose a product…</option>
                      {products.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} · {option.sku}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>

                <Field
                  label={index === 0 ? "Qty" : ""}
                  labelSuffix={product?.unit}
                  error={fieldErrors[`lines.${index}.quantity`]?.[0]}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={line.quantity}
                      onChange={(event) => updateLine(line.key, { quantity: event.currentTarget.value })}
                      inputMode="decimal"
                      disabled={pending}
                    />
                  )}
                </Field>

                <Field
                  label={index === 0 ? "Rate" : ""}
                  error={fieldErrors[`lines.${index}.unit_price`]?.[0]}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={line.unit_price}
                      onChange={(event) =>
                        updateLine(line.key, { unit_price: event.currentTarget.value })
                      }
                      inputMode="decimal"
                      placeholder="0.00"
                      disabled={pending}
                    />
                  )}
                </Field>

                <div className="flex flex-col gap-1.5">
                  {index === 0 ? (
                    <span className="text-[0.8125rem] font-medium text-fg">Amount</span>
                  ) : null}
                  <p className="num flex h-9 items-center justify-end px-1 text-sm font-medium text-fg">
                    {amount ? formatInr(amount) : "—"}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove line ${index + 1}`}
                  disabled={pending || lines.length === 1}
                  onClick={() =>
                    setLines((current) => current.filter((candidate) => candidate.key !== line.key))
                  }
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col items-end gap-1 border-t border-border pt-3">
          <p className="text-[0.8125rem] text-fg-muted">
            Items subtotal <span className="num ml-2 font-medium text-fg">{formatInr(subtotal)}</span>
          </p>
          <p className="text-xs text-fg-subtle">
            {gst
              ? "GST, rounding and any discount are calculated by the server when you save."
              : "Discount and rounding are calculated by the server when you save."}
          </p>
        </div>
      </Card>

      {/* ------------------------------------------- charges (optional) */}
      <Card className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">Additional charges</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCharges((current) => [...current, emptyCharge()])}
            disabled={pending}
          >
            <Plus aria-hidden="true" />
            Add charge
          </Button>
        </div>
        <p className="mb-3 text-xs text-fg-subtle">
          Optional. Insurance, freight or handling, each taxed at its own GST rate — an 18%
          service on a 5% scooter appears as its own row in the tax summary.
        </p>

        {charges.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-2.5 text-[0.8125rem] text-fg-muted">
            No extra charges on this invoice.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {charges.map((charge, index) => (
              <div
                key={charge.key}
                className="grid gap-2 rounded-lg border border-border bg-surface-muted p-3 md:grid-cols-[minmax(0,1fr)_7rem_6rem_7rem_2.5rem] md:items-end"
              >
                <Field
                  label={index === 0 ? "Description" : ""}
                  error={fieldErrors[`charges.${index}.description`]?.[0]}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={charge.description}
                      onChange={(e) => updateCharge(charge.key, { description: e.currentTarget.value })}
                      placeholder="Insurance Charges on Sales"
                      disabled={pending}
                    />
                  )}
                </Field>

                <Field
                  label={index === 0 ? "Amount" : ""}
                  error={fieldErrors[`charges.${index}.amount`]?.[0]}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={charge.amount}
                      onChange={(e) => updateCharge(charge.key, { amount: e.currentTarget.value })}
                      inputMode="decimal"
                      placeholder="0.00"
                      disabled={pending}
                    />
                  )}
                </Field>

                <Field
                  label={index === 0 ? "GST %" : ""}
                  error={fieldErrors[`charges.${index}.gst_rate`]?.[0]}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={charge.gst_rate}
                      onChange={(e) => updateCharge(charge.key, { gst_rate: e.currentTarget.value })}
                      inputMode="decimal"
                      disabled={pending}
                    />
                  )}
                </Field>

                <Field
                  label={index === 0 ? "SAC code" : ""}
                  error={fieldErrors[`charges.${index}.hsn_code`]?.[0]}
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={charge.hsn_code}
                      onChange={(e) => updateCharge(charge.key, { hsn_code: e.currentTarget.value })}
                      inputMode="numeric"
                      placeholder="997135"
                      disabled={pending}
                    />
                  )}
                </Field>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove charge ${index + 1}`}
                  disabled={pending}
                  onClick={() => setCharges((c) => c.filter((x) => x.key !== charge.key))}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ---------------------------------- dealer: consignee + transport */}
      {invoiceType === "dealer" ? (
        <>
          <FormSection
            title="Consignee (Ship to)"
            description="Where the goods actually go, when that differs from the billing party. Leave empty to ship to the buyer."
          >
            <Field label="Consignee name" error={fieldErrors.consignee_name?.[0]}>
              {(props) => (
                <Input
                  {...props}
                  value={transport.consignee_name}
                  onChange={(e) => updateTransport("consignee_name", e.currentTarget.value)}
                  disabled={pending}
                />
              )}
            </Field>

            <Field label="Consignee address" error={fieldErrors.consignee_address?.[0]}>
              {(props) => (
                <Textarea
                  {...props}
                  value={transport.consignee_address}
                  onChange={(e) => updateTransport("consignee_address", e.currentTarget.value)}
                  disabled={pending}
                />
              )}
            </Field>

            <Field label="Consignee GSTIN" error={fieldErrors.consignee_gstin?.[0]}>
              {(props) => (
                <Input
                  {...props}
                  value={transport.consignee_gstin}
                  onChange={(e) =>
                    updateTransport("consignee_gstin", e.currentTarget.value.toUpperCase())
                  }
                  maxLength={15}
                  disabled={pending}
                />
              )}
            </Field>

            <Field
              label="Consignee state code"
              hint="Two digits, e.g. 19 for West Bengal."
              error={fieldErrors.consignee_state_code?.[0]}
            >
              {(props) => (
                <Input
                  {...props}
                  value={transport.consignee_state_code}
                  onChange={(e) =>
                    updateTransport("consignee_state_code", e.currentTarget.value)
                  }
                  maxLength={2}
                  inputMode="numeric"
                  disabled={pending}
                />
              )}
            </Field>
          </FormSection>

          <FormSection
            title="Transport & dispatch"
            description="Printed on the dealer invoice and its e-Way Bill page. The e-Way Bill and IRN are generated on the government portal and typed in here."
          >
            {TRANSPORT_FIELDS.map((field) => (
              <Field
                key={field.name}
                label={field.label}
                hint={"hint" in field ? field.hint : undefined}
                error={fieldErrors[field.name]?.[0]}
              >
                {(props) => (
                  <Input
                    {...props}
                    value={transport[field.name] ?? ""}
                    onChange={(e) =>
                      updateTransport(field.name, e.currentTarget.value)
                    }
                    placeholder={"placeholder" in field ? field.placeholder : undefined}
                    disabled={pending}
                  />
                )}
              </Field>
            ))}

            <Field label="IRN" hint="From the e-invoice portal, if registered." error={fieldErrors.irn?.[0]}>
              {(props) => (
                <Input
                  {...props}
                  value={transport.irn}
                  onChange={(e) => updateTransport("irn", e.currentTarget.value)}
                  disabled={pending}
                />
              )}
            </Field>

            <Field label="Ack No." error={fieldErrors.ack_no?.[0]}>
              {(props) => (
                <Input
                  {...props}
                  value={transport.ack_no}
                  onChange={(e) => updateTransport("ack_no", e.currentTarget.value)}
                  disabled={pending}
                />
              )}
            </Field>
          </FormSection>
        </>
      ) : null}

      <FormSection title="Adjustments" description="Optional discount and a note for the invoice.">
        <Field
          label="Discount on invoice"
          hint="A flat amount off the whole invoice, applied before tax."
          error={fieldErrors.discount_amount?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              value={discount}
              onChange={(event) => setDiscount(event.currentTarget.value)}
              inputMode="decimal"
              placeholder="0.00"
              disabled={pending}
            />
          )}
        </Field>

        <Field label="Notes" error={fieldErrors.notes?.[0]}>
          {(props) => (
            <Textarea
              {...props}
              value={notes}
              onChange={(event) => setNotes(event.currentTarget.value)}
              placeholder="Anything that should appear on the invoice…"
              maxLength={2000}
              disabled={pending}
            />
          )}
        </Field>
      </FormSection>

      <FormActions>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(editing ? `/invoices/${invoice!.id}` : "/invoices")}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={pending}
          disabled={pending || lines.every((line) => line.product_id === "")}
        >
          {editing ? "Save draft" : "Create draft"}
        </Button>
      </FormActions>
    </form>
  );
}
