"use client";

import { ArrowRight } from "lucide-react";
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
import { Input, Select, Textarea } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { postJson } from "@/features/catalog/client";
import { previewStock, wouldGoNegative } from "@/features/inventory/stock-math";
import {
  MANUAL_MOVEMENT_TYPES,
  type ManualMovementType,
  movementDecreasesStock,
  movementRequiresNote,
} from "@/features/inventory/types";
import { formatQuantity } from "@/lib/money";

/**
 * The single stock movement dialog, reused by every entry point.
 *
 * The resulting-stock preview is a convenience only. The backend recomputes
 * the balance from the row it locks and is the sole authority, so the preview
 * never gates submission -- a client-side "this would go negative" hint warns,
 * it does not block. Blocking here would let a stale figure refuse a movement
 * the server would have accepted.
 */
type MovementTarget = {
  productId: number;
  productName: string;
  sku: string;
  unit: string;
  currentStock: string;
};

export function StockMovementDialog({
  open,
  onOpenChange,
  ...target
}: { open: boolean; onOpenChange: (open: boolean) => void } & MovementTarget) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader title="Adjust stock" description={`${target.productName} · ${target.sku}`} />

        {/*
          The form lives in its own component so it MOUNTS FRESH each time the
          dialog opens. Resetting the fields in an effect instead would mean
          setting state during render-commit on every open -- cascading
          renders, and the lint rule that forbids exactly that.
        */}
        <MovementForm {...target} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function MovementForm({
  productId,
  productName,
  unit,
  currentStock,
  onDone,
}: MovementTarget & { onDone: () => void }) {
  const router = useRouter();

  const [type, setType] = useState<ManualMovementType>("stock_in");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const decreases = movementDecreasesStock(type);
  const noteRequired = movementRequiresNote(type);
  const preview = previewStock(currentStock, quantity, decreases);
  const negative = wouldGoNegative(preview);

  const selected = MANUAL_MOVEMENT_TYPES.find((option) => option.value === type);

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    setPending(true);
    setFormError(null);
    setFieldErrors({});

    const result = await postJson<unknown>(`/products/${productId}/movements`, {
      type,
      quantity,
      note: note.trim() === "" ? null : note.trim(),
    });

    setPending(false);

    if (!result.ok) {
      setFieldErrors(result.failure.errors);

      // Field errors render inline; only show the banner for everything else
      // (a 409 INSUFFICIENT_STOCK, a network failure) so the message is not
      // duplicated directly above the field it belongs to.
      if (Object.keys(result.failure.errors).length === 0) {
        setFormError(result.failure.message);
      }

      return;
    }

    notify.success("Stock updated", {
      description: `${selected?.label ?? "Movement"} recorded for ${productName}.`,
    });

    onDone();
    // Refresh rather than patch locally: the server is authoritative, so the
    // row shown always matches what was stored.
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
          <DialogBody className="flex flex-col gap-4">
            {formError ? <FormAlert message={formError} /> : null}

            <Field
              label="Movement type"
              required
              hint={selected?.hint}
              error={fieldErrors.type?.[0]}
            >
              {(props) => (
                <Select
                  {...props}
                  value={type}
                  onChange={(event) => setType(event.currentTarget.value as ManualMovementType)}
                  disabled={pending}
                >
                  {MANUAL_MOVEMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field
              label="Quantity"
              required
              labelSuffix={unit}
              hint="Up to three decimal places."
              error={fieldErrors.quantity?.[0]}
            >
              {(props) => (
                <Input
                  {...props}
                  value={quantity}
                  onChange={(event) => setQuantity(event.currentTarget.value)}
                  placeholder="0.000"
                  inputMode="decimal"
                  autoComplete="off"
                  disabled={pending}
                />
              )}
            </Field>

            <Field
              label="Note"
              required={noteRequired}
              hint={
                noteRequired
                  ? "Required for this type, so the change is auditable."
                  : "Optional. Helps explain the change later."
              }
              error={fieldErrors.note?.[0]}
            >
              {(props) => (
                <Textarea
                  {...props}
                  value={note}
                  onChange={(event) => setNote(event.currentTarget.value)}
                  placeholder="Reason for this movement…"
                  maxLength={500}
                  disabled={pending}
                />
              )}
            </Field>

            {/* Before / after, so the operator can sanity-check the direction
                before committing. */}
            <div className="rounded-lg border border-border bg-surface-muted px-3.5 py-3">
              <div className="flex items-center justify-between gap-3 text-[0.8125rem]">
                <span className="text-fg-muted">Current stock</span>
                <span className="num font-medium text-fg">
                  {formatQuantity(currentStock)} {unit}
                </span>
              </div>

              {preview ? (
                <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-2 text-[0.8125rem]">
                  <span className="flex items-center gap-1.5 text-fg-muted">
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                    After this movement
                  </span>
                  <span
                    className={
                      "num font-semibold " + (negative ? "text-danger-700" : "text-fg")
                    }
                  >
                    {formatQuantity(preview)} {unit}
                  </span>
                </div>
              ) : null}

              {negative ? (
                <p className="mt-2 text-xs leading-relaxed text-danger-700">
                  This would take stock below zero. The server will refuse it — reduce the
                  quantity.
                </p>
              ) : null}
            </div>
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
              disabled={pending || quantity.trim() === ""}
            >
              Record movement
            </Button>
          </DialogFooter>
    </form>
  );
}
