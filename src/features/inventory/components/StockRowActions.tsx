"use client";

import { History, PackagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { StockMovementDialog } from "@/features/inventory/components/StockMovementDialog";
import type { StockSummary } from "@/features/inventory/types";

/**
 * Row actions for the stock table.
 *
 * Adjust is a plain button rather than a dropdown: it is the only frequent
 * action on this page, and burying the page's primary verb behind a menu costs
 * a click on every row.
 */
export function StockRowActions({
  product,
  canAdjust,
}: {
  product: StockSummary;
  canAdjust: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Movement history for ${product.name}`}
        title="Movement history"
        onClick={() => router.push(`/inventory/movements?product_id=${product.id}`)}
      >
        <History aria-hidden="true" />
      </Button>

      {canAdjust ? (
        <>
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            <PackagePlus aria-hidden="true" />
            Adjust
          </Button>

          <StockMovementDialog
            open={open}
            onOpenChange={setOpen}
            productId={product.id}
            productName={product.name}
            sku={product.sku}
            unit={product.unit}
            currentStock={product.current_stock}
          />
        </>
      ) : null}
    </div>
  );
}
