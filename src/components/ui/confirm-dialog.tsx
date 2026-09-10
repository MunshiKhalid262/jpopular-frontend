"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Confirmation for a destructive or state-changing action.
 *
 * Replaces window.confirm, which cannot be styled, cannot show why an action
 * might be refused, and reads as a browser artefact rather than part of the
 * product.
 *
 * Works either uncontrolled (pass `trigger`) or controlled (pass `open` and
 * `onOpenChange`), the latter for opening from a dropdown menu item where the
 * menu closes as the dialog opens.
 *
 * On failure the dialog STAYS OPEN and shows the server's message, so a
 * refusal like "this category is used by one or more products" is read in
 * context instead of vanishing.
 */
export function ConfirmDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  /** Return an error message to keep the dialog open, or null on success. */
  onConfirm: () => Promise<string | null | void>;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  function setOpen(next: boolean) {
    if (isControlled) {
      onOpenChange?.(next);
    } else {
      setInternalOpen(next);
    }

    if (!next) {
      setError(null);
    }
  }

  async function handleConfirm() {
    setPending(true);
    setError(null);

    try {
      const message = await onConfirm();

      if (typeof message === "string" && message.length > 0) {
        setError(message);

        return;
      }

      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent size="sm">
        <DialogHeader title={title} />

        <DialogBody>
          <div className="flex items-start gap-3">
            <div
              aria-hidden="true"
              className={
                "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full [&_svg]:size-4 " +
                (tone === "danger"
                  ? "bg-danger-50 text-danger-600"
                  : "bg-primary-50 text-primary-600")
              }
            >
              <AlertTriangle />
            </div>
            <div className="min-w-0 text-[0.8125rem] leading-relaxed text-fg-muted">
              {description}
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-3 rounded-md bg-danger-50 px-3 py-2 text-xs font-medium leading-relaxed text-danger-700"
            >
              {error}
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="sm" disabled={pending}>
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            size="sm"
            loading={pending}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
