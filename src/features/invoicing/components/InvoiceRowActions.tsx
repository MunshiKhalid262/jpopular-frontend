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
 * Only a DRAFT can be deleted. A finalized invoice has been issued under a GST
 * number and has moved stock, so it is cancelled rather than removed -- the
 * number must stay in the series, or the run has a hole an auditor will ask
 * about. Cancelling lives on the invoice itself, where the reason is captured.
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

    notify.success("Draft deleted", { description: label });
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

          {isDraft && canDelete ? (
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
                Delete draft
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this draft?"
        confirmLabel="Delete"
        description={
          <>
            <strong className="font-medium text-fg">{label}</strong> has not been
            issued — no number was taken and no stock moved — so deleting it
            leaves no gap. It cannot be undone.
          </>
        }
        onConfirm={remove}
      />
    </div>
  );
}
