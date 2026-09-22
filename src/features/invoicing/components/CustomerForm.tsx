"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormActions, FormSection } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/feedback";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { postJson, putJson } from "@/features/catalog/client";
import {
  CUSTOMER_TYPE_OPTIONS,
  type Customer,
  type CustomerType,
} from "@/features/invoicing/types";

export function CustomerForm({
  customer,
  defaultType = "customer",
}: {
  customer?: Customer;
  /** Which directory this form was opened from, for a new record. */
  defaultType?: CustomerType;
}) {
  const router = useRouter();
  const editing = Boolean(customer);

  const [values, setValues] = useState({
    type: customer?.type ?? defaultType,
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    city: customer?.city ?? "",
    state: customer?.state ?? "",
    state_code: customer?.state_code ?? "",
    pincode: customer?.pincode ?? "",
    gstin: customer?.gstin ?? "",
    notes: customer?.notes ?? "",
    is_active: customer?.is_active ?? true,

    default_dispatched_through: customer?.default_dispatched_through ?? "",
    default_destination: customer?.default_destination ?? "",
    default_terms_of_delivery: customer?.default_terms_of_delivery ?? "",
    default_mode_of_payment: customer?.default_mode_of_payment ?? "",
  });

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const set = (patch: Partial<typeof values>) =>
    setValues((current) => ({ ...current, ...patch }));

  const dealer = values.type === "dealer";
  // Where Cancel and a successful save return to: the directory the record
  // belongs to AFTER this save, so promoting a walk-in lands on /dealers.
  const returnTo = dealer ? "/dealers" : "/customers";
  const noun = dealer ? "Dealer" : "Customer";

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

    const result = editing
      ? await putJson<Customer>(`/customers/${customer!.id}`, payload)
      : await postJson<Customer>("/customers", payload);

    setPending(false);

    if (!result.ok) {
      setErrors(result.failure.errors);

      if (Object.keys(result.failure.errors).length === 0) {
        setFormError(result.failure.message);
      }

      return;
    }

    notify.success(editing ? `${noun} updated` : `${noun} added`);
    router.push(returnTo);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {formError ? <FormAlert message={formError} /> : null}

      <FormSection title={noun} description="Who you are billing.">
        <Field
          label="Type"
          required
          hint={
            dealer
              ? "A dealer's dispatch details are copied onto every dealer invoice you raise for them."
              : "A counter customer. Switch to Dealer to store repeating dispatch details."
          }
          error={errors.type?.[0]}
        >
          {(props) => (
            <Select
              {...props}
              value={values.type}
              onChange={(e) => set({ type: e.currentTarget.value as CustomerType })}
              disabled={pending}
            >
              {CUSTOMER_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Name" required error={errors.name?.[0]}>
          {(props) => (
            <Input
              {...props}
              value={values.name}
              onChange={(e) => set({ name: e.currentTarget.value })}
              disabled={pending}
            />
          )}
        </Field>

        <Field label="Phone" error={errors.phone?.[0]}>
          {(props) => (
            <Input
              {...props}
              value={values.phone}
              onChange={(e) => set({ phone: e.currentTarget.value })}
              inputMode="tel"
              disabled={pending}
            />
          )}
        </Field>

        <Field label="Email" error={errors.email?.[0]}>
          {(props) => (
            <Input
              {...props}
              type="email"
              value={values.email}
              onChange={(e) => set({ email: e.currentTarget.value })}
              disabled={pending}
            />
          )}
        </Field>
      </FormSection>

      <FormSection
        title="Address"
        description="The state code decides CGST+SGST vs IGST on a GST invoice, so a GST invoice cannot be finalized without it."
      >
        <Field label="Address" error={errors.address?.[0]}>
          {(props) => (
            <Textarea
              {...props}
              value={values.address}
              onChange={(e) => set({ address: e.currentTarget.value })}
              disabled={pending}
            />
          )}
        </Field>

        <Field label="City" error={errors.city?.[0]}>
          {(props) => (
            <Input
              {...props}
              value={values.city}
              onChange={(e) => set({ city: e.currentTarget.value })}
              disabled={pending}
            />
          )}
        </Field>

        <Field label="State" error={errors.state?.[0]}>
          {(props) => (
            <Input
              {...props}
              value={values.state}
              onChange={(e) => set({ state: e.currentTarget.value })}
              disabled={pending}
            />
          )}
        </Field>

        <Field
          label="GST state code"
          hint="Two digits, e.g. 32 for Kerala."
          error={errors.state_code?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              value={values.state_code}
              onChange={(e) => set({ state_code: e.currentTarget.value })}
              inputMode="numeric"
              maxLength={2}
              placeholder="32"
              disabled={pending}
            />
          )}
        </Field>

        <Field label="Pincode" error={errors.pincode?.[0]}>
          {(props) => (
            <Input
              {...props}
              value={values.pincode}
              onChange={(e) => set({ pincode: e.currentTarget.value })}
              inputMode="numeric"
              disabled={pending}
            />
          )}
        </Field>

        <Field
          label="GSTIN"
          hint={`15 characters, if the ${noun.toLowerCase()} is registered.`}
          error={errors.gstin?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              value={values.gstin}
              onChange={(e) => set({ gstin: e.currentTarget.value.toUpperCase() })}
              maxLength={15}
              disabled={pending}
            />
          )}
        </Field>
      </FormSection>

      {/*
       * Dispatch defaults, for dealers only. These are copied onto a new dealer
       * invoice and stay editable there -- changing them on an invoice never
       * writes back here, so a one-off destination does not become the default.
       *
       * There is no consignee here: the dealer IS the consignee. The goods go
       * to the party that bought them, so the name and address above serve as
       * both bill-to and ship-to.
       *
       * The per-trip fields (e-Way Bill, vehicle, LR-RR, buyer's order) are
       * deliberately absent too: defaulting those would put last week's lorry
       * on this week's invoice.
       */}
      {dealer ? (
        <FormSection
          title="Dispatch defaults"
          description="Filled in on every dealer invoice for this dealer, and editable there. The dealer is also the consignee, so the address above is used for both bill-to and ship-to."
        >
          <Field
            label="Dispatched through"
            hint="How the goods usually travel."
            error={errors.default_dispatched_through?.[0]}
          >
            {(props) => (
              <Input
                {...props}
                value={values.default_dispatched_through}
                onChange={(e) => set({ default_dispatched_through: e.currentTarget.value })}
                placeholder="BY ROAD"
                disabled={pending}
              />
            )}
          </Field>

          <Field label="Destination" error={errors.default_destination?.[0]}>
            {(props) => (
              <Input
                {...props}
                value={values.default_destination}
                onChange={(e) => set({ default_destination: e.currentTarget.value })}
                disabled={pending}
              />
            )}
          </Field>

          <Field label="Terms of delivery" error={errors.default_terms_of_delivery?.[0]}>
            {(props) => (
              <Input
                {...props}
                value={values.default_terms_of_delivery}
                onChange={(e) => set({ default_terms_of_delivery: e.currentTarget.value })}
                disabled={pending}
              />
            )}
          </Field>

          <Field label="Mode/terms of payment" error={errors.default_mode_of_payment?.[0]}>
            {(props) => (
              <Input
                {...props}
                value={values.default_mode_of_payment}
                onChange={(e) => set({ default_mode_of_payment: e.currentTarget.value })}
                placeholder="30 days credit"
                disabled={pending}
              />
            )}
          </Field>
        </FormSection>
      ) : null}

      <FormSection title="Other" description="Internal notes and status.">
        <Field label="Notes" error={errors.notes?.[0]}>
          {(props) => (
            <Textarea
              {...props}
              value={values.notes}
              onChange={(e) => set({ notes: e.currentTarget.value })}
              disabled={pending}
            />
          )}
        </Field>

        <Checkbox
          label="Active"
          description={`Inactive ${dealer ? "dealers" : "customers"} stay on historical invoices but are hidden when raising a new one.`}
          checked={values.is_active}
          onChange={(e) => set({ is_active: e.currentTarget.checked })}
          disabled={pending}
        />
      </FormSection>

      <FormActions>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(returnTo)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={pending} disabled={pending}>
          {editing ? `Save ${noun.toLowerCase()}` : `Add ${noun.toLowerCase()}`}
        </Button>
      </FormActions>
    </form>
  );
}
