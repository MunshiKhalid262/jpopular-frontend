import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { StockStatus } from "@/features/inventory/types";

/**
 * The stock status badge, centralised so wording and tone never drift between
 * the stock table, the movements page and any later dashboard tile.
 *
 * Three tones only, and only where they carry meaning: out of stock is a
 * problem (danger), low stock needs attention (warning), in stock is quiet
 * (neutral) rather than green -- reserving colour for the rows that need it is
 * what stops the column reading as a rainbow.
 */
const STATUS_META: Record<StockStatus, { label: string; tone: BadgeProps["tone"] }> = {
  out_of_stock: { label: "Out of stock", tone: "danger" },
  low_stock: { label: "Low stock", tone: "warning" },
  in_stock: { label: "In stock", tone: "neutral" },
};

export function StockStatusBadge({
  status,
  size,
}: {
  status: StockStatus;
  size?: BadgeProps["size"];
}) {
  const { label, tone } = STATUS_META[status];

  return (
    <Badge tone={tone} size={size} dot>
      {label}
    </Badge>
  );
}
