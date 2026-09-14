import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { InvoiceStatus, TaxType } from "@/features/invoicing/types";

/**
 * Status badges for invoices.
 *
 * Colour is reserved for the states that need attention: cancelled is the only
 * one that changes how the document should be read, so it is the only danger
 * tone. A finalized invoice is the normal, expected state and stays quiet.
 */
const STATUS_META: Record<InvoiceStatus, { label: string; tone: BadgeProps["tone"] }> = {
  draft: { label: "Draft", tone: "warning" },
  finalized: { label: "Finalized", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export function InvoiceStatusBadge({
  status,
  size,
}: {
  status: InvoiceStatus;
  size?: BadgeProps["size"];
}) {
  const { label, tone } = STATUS_META[status];

  return (
    <Badge tone={tone} size={size} dot>
      {label}
    </Badge>
  );
}

/**
 * "Tax Invoice" is a GST term of art, so the badge distinguishes the two
 * document types rather than leaving the operator to infer it from the totals.
 */
export function TaxTypeBadge({ taxType, size }: { taxType: TaxType; size?: BadgeProps["size"] }) {
  return (
    <Badge tone={taxType === "gst" ? "info" : "neutral"} size={size}>
      {taxType === "gst" ? "GST" : "Non-GST"}
    </Badge>
  );
}
