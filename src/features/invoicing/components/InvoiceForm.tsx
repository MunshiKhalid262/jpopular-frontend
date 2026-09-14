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
import type { Customer, Invoice } from "@/features/invoicing/types";
import { TAX_TYPE_OPTIONS } from "@/features/invoicing/types";
import { formatInr } from "@/lib/money";

type Line = {
  key: string;
  product_id: string;
  quantity: string;
  unit_price: string;
};

let lineKey = 0;
const nextKey = () => `line-${lineKey++}`;

function emptyLine(): Line {
  return { key: nextKey(), product_id: "", quantity: "1", unit_price: "" };
}

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
  const [taxType, setTaxType] = useState(invoice?.tax_type ?? (canIssueGst ? "gst" : "non_gst"));
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

    const payload = {
      customer_id: customerId === "" ? null : Number(customerId),
      tax_type: taxType,
      invoice_date: invoiceDate,
      discount_amount: discount.trim() === "" ? null : discount.trim(),
      notes: notes.trim() === "" ? null : notes.trim(),
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
