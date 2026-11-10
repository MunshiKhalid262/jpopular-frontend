"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { MovementDateDialog } from "@/features/inventory/components/MovementDateDialog";
import { MANUAL_MOVEMENT_TYPES } from "@/features/inventory/types";

/**
 * The movement date, with a pencil when it can be corrected.
 *
 * Only for a movement an operator recorded. One written by an invoice takes
 * its date from that invoice, and offering to edit it here would invite the
 * two to disagree about when the goods went out -- the server refuses it, so
 * the button is not shown in the first place.
 */
export function MovementDateCell({
  movementId,
  type,
  typeLabel,
  productName,
  occurredAt,
  display,
  canAdjust,
}: {
  movementId: number;
  type: string;
  typeLabel: string;
  productName: string;
  /** ISO timestamp from the API. */
  occurredAt: string | null;
  /** Already formatted for reading. */
  display: string;
  canAdjust: boolean;
}) {
  const [open, setOpen] = useState(false);

  const editable =
    canAdjust &&
    occurredAt !== null &&
    MANUAL_MOVEMENT_TYPES.some((option) => option.value === type);

  if (!editable) {
    return <span className="whitespace-nowrap">{display}</span>;
  }

  return (
    <span className="group flex items-center gap-1.5 whitespace-nowrap">
      {display}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Change the date of this ${typeLabel.toLowerCase()}`}
        className="rounded p-0.5 text-fg-subtle opacity-0 transition hover:bg-surface-muted hover:text-fg focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Pencil aria-hidden="true" className="size-3.5" />
      </button>

      <MovementDateDialog
        open={open}
        onOpenChange={setOpen}
        movementId={movementId}
        productName={productName}
        typeLabel={typeLabel}
        currentDate={occurredAt.slice(0, 10)}
      />
    </span>
  );
}
