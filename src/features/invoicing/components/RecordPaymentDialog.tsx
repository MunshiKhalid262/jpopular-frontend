"use client";

import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { postJson } from "@/features/catalog/client";
import { formatInr } from "@/lib/money";

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
] as const;

/**
 * Records a payment against an invoice.
 *
 * The balance shown is the server's figure. The amount is NOT validated
 * against it in the browser beyond a convenience default: the server re-checks
 * inside the invoice row lock, which is the only place the check is safe when
 * two payments arrive at once.
 */
export function RecordPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  dueAmount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  invoiceNumber: string | null;
  dueAmount: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader
          title="Record payment"
          description={`${invoiceNumber ?? `Invoice #${invoiceId}`} · ${formatInr(dueAmount)} outstanding`}
        />
        {/* Its own component so it mounts fresh each time the dialog opens,
            rather than resetting state in an effect. */}
        <PaymentForm
          invoiceId={invoiceId}
          dueAmount={dueAmount}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({
  invoiceId,
  dueAmount,
  onDone,
}: {
  invoiceId: number;
  dueAmount: string;
  onDone: () => void;
}) {
  const router = useRouter();

  // Defaults to settling the invoice, which is the common case at a counter.
  const [amount, setAmount] = useState(dueAmount);
  const [method, setMethod] = useState<string>("cash");
  const [reference, setReference] = useState("");

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setPending(true);
    setFormError(null);
    setErrors({});

    const result = await postJson<unknown>(`/invoices/${invoiceId}/payments`, {
      amount,
      payment_method: method,
      reference: reference.trim() === "" ? null : reference.trim(),
    });

    setPending(false);

    if (!result.ok) {
      setErrors(result.failure.errors);

      if (Object.keys(result.failure.errors).length === 0) {
        setFormError(result.failure.message);
      }

      return;
    }

    notify.success("Payment recorded", { description: formatInr(amount) });
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <DialogBody className="flex flex-col gap-4">
        {formError ? <FormAlert message={formError} /> : null}

        <Field
          label="Amount"
          required
          hint={`Outstanding: ${formatInr(dueAmount)}`}
          error={errors.amount?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              value={amount}
              onChange={(event) => setAmount(event.currentTarget.value)}
              inputMode="decimal"
              autoComplete="off"
              disabled={pending}
            />
          )}
        </Field>

        <Field label="Method" required error={errors.payment_method?.[0]}>
          {(props) => (
            <Select
              {...props}
              value={method}
              onChange={(event) => setMethod(event.currentTarget.value)}
              disabled={pending}
            >
              {METHODS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label="Reference"
          hint="UPI reference, cheque number, card slip — whatever helps later."
          error={errors.reference?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              value={reference}
              onChange={(event) => setReference(event.currentTarget.value)}
              maxLength={80}
              disabled={pending}
            />
          )}
        </Field>
      </DialogBody>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary" size="sm" disabled={pending}>
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={pending}
          disabled={pending || amount.trim() === ""}
        >
          <Wallet aria-hidden="true" />
          Record payment
        </Button>
      </DialogFooter>
    </form>
  );
}
