"use client";

import { Ban, CheckCircle2, PencilLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { notify } from "@/components/ui/toast";
import { del, postJson } from "@/features/catalog/client";
import type { Invoice } from "@/features/invoicing/types";

/**
 * Finalize, cancel, edit and delete for one invoice.
 *
 * Every state change is confirmed rather than fired on a single click, because
 * each is irreversible in a way the operator should see coming: finalizing
 * allocates a number and deducts stock, cancelling returns stock and voids a
 * legal document, and a draft delete is gone for good.
 */
export function InvoiceLifecycleActions({
  invoice,
  canUpdate,
  canFinalize,
  canCancel,
  canDelete,
}: {
  invoice: Invoice;
  canUpdate: boolean;
  canFinalize: boolean;
  canCancel: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();

  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");

  const isDraft = invoice.status === "draft";
  const isFinalized = invoice.status === "finalized";

  async function finalize(): Promise<string | null> {
    const result = await postJson(`/invoices/${invoice.id}/finalize`, {});

    if (!result.ok) {
      return result.failure.message;
    }

    notify.success("Invoice finalized", { description: "Stock has been deducted." });
    router.refresh();

    return null;
  }

  async function cancel(): Promise<string | null> {
    if (reason.trim().length < 3) {
      return "Give a reason for cancelling, so the record explains itself later.";
    }

    const result = await postJson(`/invoices/${invoice.id}/cancel`, { reason: reason.trim() });

    if (!result.ok) {
      return result.failure.message;
    }

    notify.success("Invoice cancelled", { description: "Stock has been returned." });
    router.refresh();

    return null;
  }

  async function destroy(): Promise<string | null> {
    const result = await del(`/invoices/${invoice.id}`);

    if (!result.ok) {
      return result.failure.message;
    }

    notify.success("Draft deleted");
    router.push("/invoices");

    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isDraft && canUpdate ? (
        <ButtonLink href={`/invoices/${invoice.id}/edit`} variant="secondary" size="sm">
          <PencilLine aria-hidden="true" />
          Edit
        </ButtonLink>
      ) : null}

      {isDraft && canFinalize ? (
        <Button variant="primary" size="sm" onClick={() => setFinalizeOpen(true)}>
          <CheckCircle2 aria-hidden="true" />
          Finalize
        </Button>
      ) : null}

      {isFinalized && canCancel ? (
        <Button variant="secondary" size="sm" onClick={() => setCancelOpen(true)}>
          <Ban aria-hidden="true" />
          Cancel invoice
        </Button>
      ) : null}

      {isDraft && canDelete ? (
        <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 aria-hidden="true" />
          Delete draft
        </Button>
      ) : null}

      <ConfirmDialog
        open={finalizeOpen}
        onOpenChange={setFinalizeOpen}
        tone="primary"
        title="Finalize this invoice?"
        confirmLabel="Finalize"
        description="It will be given its invoice number and stock will be deducted. After this the invoice cannot be edited — only cancelled."
        onConfirm={finalize}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this invoice?"
        confirmLabel="Cancel invoice"
        cancelLabel="Keep it"
        description={
          <div className="flex flex-col gap-3">
            <p>
              Stock will be returned and the invoice will be marked cancelled. It keeps its
              number and stays viewable — a gap in the sequence is itself an audit question.
            </p>
            <Field label="Reason" required>
              {(props) => (
                <Textarea
                  {...props}
                  value={reason}
                  onChange={(event) => setReason(event.currentTarget.value)}
                  placeholder="Why is this invoice being cancelled?"
                  maxLength={500}
                />
              )}
            </Field>
          </div>
        }
        onConfirm={cancel}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this draft?"
        confirmLabel="Delete"
        description="The draft has no invoice number and has not affected stock, so nothing is left behind. This cannot be undone."
        onConfirm={destroy}
      />
    </div>
  );
}
