"use client";

import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

/**
 * Toast notifications.
 *
 * Styled from our own tokens rather than sonner's defaults, so a toast looks
 * like part of the product. Wrapped in a thin API so pages call
 * `notify.success(...)` and never import sonner directly -- swapping the
 * library later would then touch one file.
 */

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      // Errors need longer than confirmations, because they are read.
      duration={4500}
      gap={10}
      offset={20}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border !border-border !bg-surface !text-fg !shadow-popover !font-sans !text-[0.8125rem] !gap-3 !px-4 !py-3",
          title: "!font-medium !text-fg",
          description: "!text-fg-muted !text-xs !leading-relaxed !mt-0.5",
          actionButton: "!bg-primary-600 !text-fg-inverted !rounded-md !text-xs !font-medium",
          cancelButton: "!bg-surface-inset !text-fg-muted !rounded-md !text-xs",
          closeButton: "!bg-surface !border-border !text-fg-subtle",
        },
      }}
      icons={{
        success: <CheckCircle2 className="size-4 text-success-600" aria-hidden="true" />,
        error: <XCircle className="size-4 text-danger-600" aria-hidden="true" />,
        warning: <TriangleAlert className="size-4 text-warning-600" aria-hidden="true" />,
        info: <Info className="size-4 text-info-600" aria-hidden="true" />,
      }}
    />
  );
}

type NotifyOptions = { description?: string };

export const notify = {
  success(message: string, options?: NotifyOptions) {
    sonnerToast.success(message, options);
  },
  error(message: string, options?: NotifyOptions) {
    sonnerToast.error(message, options);
  },
  warning(message: string, options?: NotifyOptions) {
    sonnerToast.warning(message, options);
  },
  info(message: string, options?: NotifyOptions) {
    sonnerToast.info(message, options);
  },
};
