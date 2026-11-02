"use client";

import { Eye, PencilLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  RowActionsTrigger,
} from "@/components/ui/dropdown-menu";
import { notify } from "@/components/ui/toast";
import { del } from "@/features/catalog/client";
import type { InvoiceStatus } from "@/features/invoicing/types";

/**
 * Row actions for one invoice in the list.
 *
 * Any status can be deleted, but they are not the same act. A draft was never
 * issued, so removing it costs nothing. A finalized or cancelled invoice has
 * been out in the world under a GST number: deleting it returns its stock,
 * takes its movements and payments with it, and leaves a hole in the series
 * that an auditor can ask about. The dialog says which case the operator is
 * in; cancelling, which keeps the document and records a reason, stays the
 * gentler option and lives on the invoice itself.
 */
export function InvoiceRowActions({
  invoiceId,
  invoiceNumber,
  status,
  canUpdate,
  canDelete,
}: {
  invoiceId: number;
  invoiceNumber: string | null;
  status: InvoiceStatus;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isDraft = status === "draft";
  const label = invoiceNumber ?? `Draft #${invoiceId}`;

  async function remove(): Promise<string | null> {
    const result = await del(`/invoices/${invoiceId}`);

    if (!result.ok) {
      return result.failure.message;
    }

    notify.success(isDraft ? "Draft deleted" : "Invoice deleted", {
      description: isDraft ? label : `${label} — its stock has been returned.`,
    });
    router.refresh();

    return null;
  }

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <RowActionsTrigger label={`Actions for ${label}`} />

        <DropdownMenuContent>
          <DropdownMenuItem
            icon={<Eye aria-hidden="true" />}
            onSelect={() => router.push(`/invoices/${invoiceId}`)}
          >
            View invoice
          </DropdownMenuItem>

          {isDraft && canUpdate ? (
            <DropdownMenuItem
              icon={<PencilLine aria-hidden="true" />}
              onSelect={() => router.push(`/invoices/${invoiceId}/edit`)}
            >
              Edit draft
            </DropdownMenuItem>
          ) : null}

          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                tone="danger"
                icon={<Trash2 aria-hidden="true" />}
                onSelect={(event) => {
                  // Radix hands focus back to the trigger on select; stopping
                  // that lets the dialog take it cleanly.
                  event.preventDefault();
                  setDeleteOpen(true);
                }}
              >
                {isDraft ? "Delete draft" : "Delete invoice"}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={isDraft ? "Delete this draft?" : "Delete this invoice?"}
        confirmLabel="Delete"
        description={
          isDraft ? (
            <>
              <strong className="font-medium text-fg">{label}</strong> has not been
              issued — no number was taken and no stock moved — so deleting it
              leaves no gap. It cannot be undone.
            </>
          ) : (
            <>
              <strong className="font-medium text-fg">{label}</strong>, its stock
              movements and any payments against it will be removed, and stock it
              took goes back to the shelf. The number is not reused, so the
              sequence keeps a gap. Cancelling instead keeps the document and
              records a reason. This cannot be undone.
            </>
          )
        }
        onConfirm={remove}
      />
    </div>
  );
}
