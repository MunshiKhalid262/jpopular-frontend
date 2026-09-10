"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Dialog, built on Radix.
 *
 * Radix rather than hand-rolled because a correct modal needs a focus trap,
 * focus restore on close, Escape handling, scroll locking, `aria-modal`, and
 * inert background content. Those are easy to get subtly wrong and are exactly
 * what makes a dialog unusable by keyboard.
 */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  children,
  className,
  size = "md",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const widths = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
  } as const;

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-50 bg-fg/25 backdrop-blur-[2px]"
        style={{ animation: "jp-overlay-in 150ms var(--ease-out-quart)" }}
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
          "rounded-xl border border-border bg-surface shadow-lg",
          "focus:outline-none",
          widths[size],
          className,
        )}
        style={{ animation: "jp-content-in 160ms var(--ease-out-quart)" }}
      >
        {children}
        <DialogPrimitive.Close asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close dialog"
            className="absolute right-3 top-3"
          >
            <X aria-hidden="true" />
          </Button>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({
  title,
  description,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border px-5 py-4 pr-12">
      {/* Title and Description are Radix components so they are wired to
          aria-labelledby / aria-describedby automatically. */}
      <DialogPrimitive.Title className="text-sm font-semibold text-fg">
        {title}
      </DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description className="mt-1 text-[0.8125rem] leading-relaxed text-fg-muted">
          {description}
        </DialogPrimitive.Description>
      ) : null}
    </div>
  );
}

export function DialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border bg-surface-muted px-5 py-3.5">
      {children}
    </div>
  );
}
