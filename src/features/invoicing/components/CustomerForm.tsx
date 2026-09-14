"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FormActions, FormSection } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/feedback";
import { Checkbox, Input, Textarea } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { postJson, putJson } from "@/features/catalog/client";
import type { Customer } from "@/features/invoicing/types";

export function CustomerForm({ customer }: { customer?: Customer }) {
  const router = useRouter();
  const editing = Boolean(customer);

  const [values, setValues] = useState({
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
  });

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const set = (patch: Partial<typeof values>) =>
    setValues((current) => ({ ...current, ...patch }));

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

    notify.success(editing ? "Customer updated" : "Customer added");
    router.push("/customers");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {formError ? <FormAlert message={formError} /> : null}

      <FormSection title="Customer" description="Who you are billing.">
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

        <Field label="GSTIN" hint="15 characters, if the customer is registered." error={errors.gstin?.[0]}>
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
          description="Inactive customers stay on historical invoices but are hidden when raising a new one."
          checked={values.is_active}
          onChange={(e) => set({ is_active: e.currentTarget.checked })}
          disabled={pending}
        />
      </FormSection>

      <FormActions>
        <Button type="button" variant="secondary" onClick={() => router.push("/customers")} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={pending} disabled={pending}>
          {editing ? "Save customer" : "Add customer"}
        </Button>
      </FormActions>
    </form>
  );
}
