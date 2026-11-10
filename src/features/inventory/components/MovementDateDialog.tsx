"use client";

import { CalendarDays } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { patchJson } from "@/features/catalog/client";

/**
 * Corrects the date one stock movement is recorded against.
 *
 * The DATE only. Quantity and type are not editable here, and that is
 * deliberate: the ledger is append-only because every later balance was
 * calculated from the rows before it. A wrong quantity is corrected with a
 * compensating movement, which leaves both the mistake and the fix on the
 * record.
 *
 * The date carries no arithmetic -- the balance is the sum of the quantities,
 * whatever dates they bear -- so it is the one field that can be moved without
 * rewriting history.
 */
export function MovementDateDialog({
  open,
  onOpenChange,
  movementId,
  productName,
  typeLabel,
  currentDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movementId: number;
  productName: string;
  typeLabel: string;
  /** ISO date (YYYY-MM-DD) the picker opens on. */
  currentDate: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader
          title="Change movement date"
          description={`${typeLabel} · ${productName}`}
        />

        {/* Mounted fresh per open, so the field resets without an effect. */}
        <DateForm
          movementId={movementId}
          currentDate={currentDate}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function DateForm({
  movementId,
  currentDate,
  onDone,
}: {
  movementId: number;
  currentDate: string;
  onDone: () => void;
}) {
  const router = useRouter();

  const [date, setDate] = useState(currentDate);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setPending(true);
    setFormError(null);
    setFieldErrors({});

    const result = await patchJson<unknown>(`/inventory/movements/${movementId}`, {
      occurred_at: date,
    });

    setPending(false);

    if (!result.ok) {
      setFieldErrors(result.failure.errors);

      // A movement the ledger wrote itself comes back 422 with no field
      // errors, so the banner is where that explanation lands.
      if (Object.keys(result.failure.errors).length === 0) {
        setFormError(result.failure.message);
      }

      return;
    }

    notify.success("Date updated", { description: "Stock levels are unchanged." });

    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <DialogBody className="flex flex-col gap-4">
        {formError ? <FormAlert message={formError} /> : null}

        <Field
          label="Date"
          required
          hint="When the stock actually moved. Changing this does not alter any stock level."
          error={fieldErrors.occurred_at?.[0]}
        >
          {(props) => (
            <Input
              {...props}
              type="date"
              value={date}
              onChange={(event) => setDate(event.currentTarget.value)}
              disabled={pending}
            />
          )}
        </Field>
      </DialogBody>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary" disabled={pending}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" variant="primary" loading={pending} disabled={pending}>
          <CalendarDays aria-hidden="true" />
          Save date
        </Button>
      </DialogFooter>
    </form>
  );
}
