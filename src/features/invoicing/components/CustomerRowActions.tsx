"use client";

import { Archive, PencilLine } from "lucide-react";
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
import type { CustomerType } from "@/features/invoicing/types";

/**
 * Row actions for a customer or dealer: edit, plus archive behind a
 * confirmation.
 *
 * Archive, never hard delete. The party appears on every invoice ever raised
 * for them and `invoices.customer_id` is RESTRICT on delete, so removing the
 * row outright would either fail or orphan a tax document. Archiving hides
 * them from new invoices and leaves the history intact.
 */
export function CustomerRowActions({
  id,
  name,
  type,
  invoiceCount,
  canManage,
  canDelete,
}: {
  id: number;
  name: string;
  type: CustomerType;
  /** Undefined when the list did not ask for it; the dialog then stays vague. */
  invoiceCount?: number;
  canManage: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [archiveOpen, setArchiveOpen] = useState(false);

  if (!canManage && !canDelete) {
    return null;
  }

  const dealer = type === "dealer";
  const noun = dealer ? "dealer" : "customer";
  const base = dealer ? "/dealers" : "/customers";

  async function archive(): Promise<string | null> {
    const result = await del(`/customers/${id}`);

    if (!result.ok) {
      return result.failure.message;
    }

    notify.success(`${dealer ? "Dealer" : "Customer"} archived`, { description: name });
    router.refresh();

    return null;
  }

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <RowActionsTrigger label={`Actions for ${name}`} />

        <DropdownMenuContent>
          {canManage ? (
            <DropdownMenuItem
              icon={<PencilLine aria-hidden="true" />}
              onSelect={() => router.push(`${base}/${id}/edit`)}
            >
              Edit {noun}
            </DropdownMenuItem>
          ) : null}

          {canDelete ? (
            <>
              {canManage ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                tone="danger"
                icon={<Archive aria-hidden="true" />}
                onSelect={(event) => {
                  // Radix returns focus to the trigger on select; preventing
                  // that lets the dialog take focus cleanly.
                  event.preventDefault();
                  setArchiveOpen(true);
                }}
              >
                Archive {noun}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive ${noun}?`}
        confirmLabel="Archive"
        description={
          invoiceCount && invoiceCount > 0 ? (
            <>
              <strong className="font-medium text-fg">{name}</strong> is on{" "}
              {invoiceCount} invoice{invoiceCount === 1 ? "" : "s"}. Those stay
              exactly as they are — archiving only stops the {noun} appearing
              when you raise a new one.
            </>
          ) : (
            <>
              <strong className="font-medium text-fg">{name}</strong> will be
              hidden from new invoices. Nothing already recorded changes, and the{" "}
              {noun} can be restored later.
            </>
          )
        }
        onConfirm={archive}
      />
    </div>
  );
}
