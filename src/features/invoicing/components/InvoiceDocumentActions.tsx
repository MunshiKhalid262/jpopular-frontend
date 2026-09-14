"use client";

import { Download, Eye, Printer } from "lucide-react";
import { useRef, useState } from "react";

import { Button, ButtonLink, buttonVariants } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { invoiceDocumentUrls } from "@/features/invoicing/types";

/**
 * Preview, Download and Print for one invoice.
 *
 * All three hit the same backend document endpoints, which render the same
 * template from the same snapshot data -- so the preview is exactly what
 * downloads and exactly what prints. No PDF is stored anywhere; each request
 * generates one and discards it.
 */
export function InvoiceDocumentActions({
  invoiceId,
  invoiceNumber,
  size = "sm",
}: {
  invoiceId: number;
  invoiceNumber: string | null;
  size?: "sm" | "md";
}) {
  const urls = invoiceDocumentUrls(invoiceId);
  const [printing, setPrinting] = useState(false);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  /**
   * Printing renders the invoice into a hidden iframe and prints THAT, so the
   * sidebar, top bar and these buttons are not part of the printed document at
   * all -- rather than relying on a print stylesheet to hide them.
   */
  function print() {
    setPrinting(true);

    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.src = urls.print;

    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        notify.error("Could not open the print dialog", {
          description: "Use Preview and print from there instead.",
        });
      } finally {
        setPrinting(false);
        // Leave the frame long enough for the dialog to read it, then clean up.
        window.setTimeout(() => frame.remove(), 60_000);
      }
    };

    frame.onerror = () => {
      setPrinting(false);
      frame.remove();
      notify.error("Could not load the invoice for printing");
    };

    frameRef.current = frame;
    document.body.appendChild(frame);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ButtonLink href={`/invoices/${invoiceId}/preview`} variant="secondary" size={size}>
        <Eye aria-hidden="true" />
        Preview
      </ButtonLink>

      {/*
        A PLAIN <a>, deliberately not next/link and not a fetch-to-blob:
          - next/link would intercept the click as a client-side navigation,
            and the download would never start;
          - a blob would discard the Content-Disposition filename the API
            sends (invoice-JP-2026-27-00001.pdf) and leave an object URL to
            revoke.
        The browser's own download handling is simply correct here.
      */}
      <a
        href={urls.download}
        download
        className={buttonVariants({ variant: "secondary", size })}
      >
        <Download aria-hidden="true" />
        Download PDF
      </a>

      <Button variant="secondary" size={size} onClick={print} loading={printing}>
        <Printer aria-hidden="true" />
        Print
      </Button>

      <span className="sr-only">
        Document actions for invoice {invoiceNumber ?? `#${invoiceId}`}
      </span>
    </div>
  );
}
