import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type SummaryItem = {
  label: string;
  value: string;
  emphasis?: boolean;
};

/**
 * The totals strip above a report table.
 *
 * Every figure here is computed SERVER-SIDE over the whole filtered set, not
 * just the visible page, and not by summing rows in the browser. The frontend
 * formats; it never does financial arithmetic.
 */
export function SummaryCards({ items }: { items: SummaryItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
      {items.map((item) => (
        <Card key={item.label} className="p-3.5">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
            {item.label}
          </p>
          <p
            className={cn(
              "num mt-1 tabular-nums",
              item.emphasis ? "text-lg font-semibold text-fg" : "text-base font-medium text-fg",
            )}
          >
            {item.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
