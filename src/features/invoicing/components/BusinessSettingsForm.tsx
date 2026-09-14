"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormActions, FormSection } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/feedback";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { putJson } from "@/features/catalog/client";
import type { BusinessSettings } from "@/features/invoicing/types";

/**
 * The seller details that appear on every invoice.
 *
 * These are not cosmetic: `state_code` decides CGST+SGST vs IGST on every GST
 * invoice, and `invoice_prefix` feeds the numbering sequence. A GST invoice
 * cannot be finalized until the state code is set.
 */
export function BusinessSettingsForm({
  settings,
  readOnly,
}: {
  settings: BusinessSettings;
  readOnly: boolean;
}) {
  const router = useRouter();

  const [values, setValues] = useState({
    business_name: settings.business_name ?? "",
    legal_name: settings.legal_name ?? "",
    gstin: settings.gstin ?? "",
    address_line1: settings.address_line1 ?? "",
    address_line2: settings.address_line2 ?? "",
    city: settings.city ?? "",
    state: settings.state ?? "",
    state_code: settings.state_code ?? "",
    pincode: settings.pincode ?? "",
    phone: settings.phone ?? "",
    email: settings.email ?? "",
    invoice_prefix: settings.invoice_prefix ?? "JP",
    invoice_terms: settings.invoice_terms ?? "",
    bank_name: settings.bank_name ?? "",
    bank_account_number: settings.bank_account_number ?? "",
    bank_ifsc: settings.bank_ifsc ?? "",
    upi_id: settings.upi_id ?? "",
    enable_round_off: settings.enable_round_off,
  });

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const set = (patch: Partial<typeof values>) =>
    setValues((current) => ({ ...current, ...patch }));

  const disabled = pending || readOnly;

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setPending(true);
    setFormError(null);
    setErrors({});

    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) =>
        typeof value === "string" ? [key, value.trim() === "" ? null : value.trim()] : [key, value],
      ),
    );

    // business_name is required by the API, so never send it as null.
    payload.business_name = values.business_name.trim();

    const result = await putJson<BusinessSettings>("/settings/business", payload);

    setPending(false);

    if (!result.ok) {
      setErrors(result.failure.errors);

      if (Object.keys(result.failure.errors).length === 0) {
        setFormError(result.failure.message);
      }

      return;
    }

    notify.success("Business settings saved", {
      description: "New invoices will use these details.",
    });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {formError ? <FormAlert message={formError} /> : null}

      {!settings.can_issue_gst_invoices ? (
        <div className="rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-[0.8125rem] leading-relaxed text-warning-700">
          No GST state code is set, so GST invoices cannot be finalized yet. Set it below — for
          example 32 for Kerala — and GST invoicing becomes available.
        </div>
      ) : null}

      <FormSection title="Business" description="Appears in the header of every invoice.">
        <Field label="Business name" required error={errors.business_name?.[0]}>
          {(props) => (
            <Input
              {...props}
              value={values.business_name}
              onChange={(e) => set({ business_name: e.currentTarget.value })}
              disabled={disabled}
            />
          )}
        </Field>

        <Field label="Legal name" hint="If it differs from the trading name." error={errors.legal_name?.[0]}>
          {(props) => (
            <Input
              {...props}
              value={values.legal_name}
              onChange={(e) => set({ legal_name: e.currentTarget.value })}
              disabled={disabled}
            />
          )}
        </Field>

        <Field label="GSTIN" hint="15 characters." error={errors.gstin?.[0]}>
          {(props) => (
            <Input
              {...props}
              value={values.gstin}
              onChange={(e) => set({ gstin: e.currentTarget.value.toUpperCase() })}
              maxLength={15}
              disabled={disabled}
            />
          )}
        </Field>

        <Field label="Phone" error={errors.phone?.[0]}>
          {(props) => (
            <Input {...props} value={values.phone} onChange={(e) => set({ phone: e.currentTarget.value })} disabled={disabled} />
          )}
        </Field>

        <Field label="Email" error={errors.email?.[0]}>
          {(props) => (
            <Input {...props} type="email" value={values.email} onChange={(e) => set({ email: e.currentTarget.value })} disabled={disabled} />
          )}
        </Field>
      </FormSection>

      <FormSection
        title="Address"
        description="The GST state code here is the seller side of the intra/inter-state decision."
      >
        <Field label="Address line 1" error={errors.address_line1?.[0]}>
          {(props) => (
            <Input {...props} value={values.address_line1} onChange={(e) => set({ address_line1: e.currentTarget.value })} disabled={disabled} />
          )}
        </Field>

        <Field label="Address line 2" error={errors.address_line2?.[0]}>
          {(props) => (
            <Input {...props} value={values.address_line2} onChange={(e) => set({ address_line2: e.currentTarget.value })} disabled={disabled} />
          )}
        </Field>

        <Field label="City" error={errors.city?.[0]}>
          {(props) => (
            <Input {...props} value={values.city} onChange={(e) => set({ city: e.currentTarget.value })} disabled={disabled} />
          )}
        </Field>

        <Field label="State" error={errors.state?.[0]}>
          {(props) => (
            <Input {...props} value={values.state} onChange={(e) => set({ state: e.currentTarget.value })} disabled={disabled} />
          )}
        </Field>

        <Field label="GST state code" required hint="Two digits, e.g. 32 for Kerala." error={errors.state_code?.[0]}>
          {(props) => (
            <Input
              {...props}
              value={values.state_code}
              onChange={(e) => set({ state_code: e.currentTarget.value })}
              inputMode="numeric"
              maxLength={2}
              placeholder="32"
              disabled={disabled}
            />
          )}
        </Field>

        <Field label="Pincode" error={errors.pincode?.[0]}>
          {(props) => (
            <Input {...props} value={values.pincode} onChange={(e) => set({ pincode: e.currentTarget.value })} disabled={disabled} />
          )}
        </Field>
      </FormSection>

      <FormSection title="Invoicing" description="Numbering and the footer of every invoice.">
        <Field
          label="Invoice prefix"
          hint="Up to 4 characters. Numbers look like JP/2026-27/00001 and must stay within GST's 16-character limit."
          error={errors.invoice_prefix?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              value={values.invoice_prefix}
              onChange={(e) => set({ invoice_prefix: e.currentTarget.value.toUpperCase() })}
              maxLength={4}
              disabled={disabled}
            />
          )}
        </Field>

        <Field label="Default terms" error={errors.invoice_terms?.[0]}>
          {(props) => (
            <Textarea {...props} value={values.invoice_terms} onChange={(e) => set({ invoice_terms: e.currentTarget.value })} disabled={disabled} />
          )}
        </Field>

        <Checkbox
          label="Round off invoice totals"
          description="Rounds the grand total to the nearest rupee and shows the adjustment as a line."
          checked={values.enable_round_off}
          onChange={(e) => set({ enable_round_off: e.currentTarget.checked })}
          disabled={disabled}
        />
      </FormSection>

      <FormSection title="Payment details" description="Printed in the invoice footer.">
        <Field label="Bank name" error={errors.bank_name?.[0]}>
          {(props) => (
            <Input {...props} value={values.bank_name} onChange={(e) => set({ bank_name: e.currentTarget.value })} disabled={disabled} />
          )}
        </Field>

        <Field label="Account number" error={errors.bank_account_number?.[0]}>
          {(props) => (
            <Input {...props} value={values.bank_account_number} onChange={(e) => set({ bank_account_number: e.currentTarget.value })} disabled={disabled} />
          )}
        </Field>

        <Field label="IFSC" error={errors.bank_ifsc?.[0]}>
          {(props) => (
            <Input {...props} value={values.bank_ifsc} onChange={(e) => set({ bank_ifsc: e.currentTarget.value.toUpperCase() })} maxLength={11} disabled={disabled} />
          )}
        </Field>

        <Field label="UPI ID" error={errors.upi_id?.[0]}>
          {(props) => (
            <Input {...props} value={values.upi_id} onChange={(e) => set({ upi_id: e.currentTarget.value })} disabled={disabled} />
          )}
        </Field>
      </FormSection>

      {!readOnly ? (
        <FormActions>
          <Button type="submit" variant="primary" loading={pending} disabled={pending}>
            Save settings
          </Button>
        </FormActions>
      ) : null}
    </form>
  );
}
