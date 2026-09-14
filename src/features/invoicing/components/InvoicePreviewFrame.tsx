"use client";

import { Download, Printer } from "lucide-react";
import { useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { notify } from "@/components/ui/toast";
import { invoiceDocumentUrls } from "@/features/invoicing/types";

/**
 * The rendered invoice, in an iframe, with its own toolbar.
 *
 * Printing calls print() on the FRAME, so the printed output is the invoice
 * document and nothing else -- no sidebar, no navigation, no buttons. That is
 * structural rather than a print stylesheet hiding app chrome, which is easy
 * to get subtly incomplete.
 */
export function InvoicePreviewFrame({
  invoiceId,
  invoiceNumber,
  cancelled,
}: {
  invoiceId: number;
  invoiceNumber: string | null;
  cancelled: boolean;
}) {
  const urls = invoiceDocumentUrls(invoiceId);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  function print() {
    const frame = frameRef.current;

    if (!frame?.contentWindow) {
      notify.error("The preview is still loading", { description: "Try again in a moment." });

      return;
    }

    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch {
      notify.error("Could not open the print dialog", {
        description: "Download the PDF and print it from your PDF viewer instead.",
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.8125rem] text-fg-muted">
          {cancelled
            ? "This invoice is cancelled. The document is stamped accordingly and remains available for your records."
            : "This is the finalized document, rendered from the invoice as it was issued."}
        </p>

        <div className="flex items-center gap-2">
          <a
            href={urls.download}
            download
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <Download aria-hidden="true" />
            Download PDF
          </a>

          <Button variant="primary" size="sm" onClick={print} disabled={!loaded}>
            <Printer aria-hidden="true" />
            Print
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-border bg-surface-muted">
        {!loaded ? (
          <div className="absolute inset-0 z-10 flex flex-col gap-3 bg-surface-muted p-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : null}

        <iframe
          ref={frameRef}
          src={urls.preview}
          title={`Invoice ${invoiceNumber ?? invoiceId}`}
          onLoad={() => setLoaded(true)}
          className="h-[80vh] min-h-[40rem] w-full border-0 bg-white"
        />
      </div>
    </div>
  );
}
