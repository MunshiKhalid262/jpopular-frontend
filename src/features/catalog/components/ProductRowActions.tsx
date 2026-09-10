"use client";

import { Archive, Eye, PencilLine, Power, PowerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  RowActionsTrigger,
} from "@/components/ui/dropdown-menu";
import { notify } from "@/components/ui/toast";
import { del, putJson } from "@/features/catalog/client";

/**
 * Row actions for a product.
 *
 * Destructive and state-changing actions go through a confirm dialog rather
 * than firing on a single click, and nothing is applied optimistically: the
 * list refreshes only after the server confirms, so what is shown always
 * matches what was stored.
 */
export function ProductRowActions({
  productId,
  productName,
  isActive,
  canUpdate,
  canDelete,
}: {
  productId: number;
  productName: string;
  isActive: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [statusOpen, setStatusOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  async function toggleStatus(): Promise<string | null> {
    const result = await putJson(`/products/${productId}/status`, { is_active: !isActive });

    if (!result.ok) {
      return result.failure.message;
    }

    notify.success(isActive ? "Product deactivated" : "Product activated", {
      description: productName,
    });
    router.refresh();

    return null;
  }

  async function archive(): Promise<string | null> {
    const result = await del(`/products/${productId}`);

    if (!result.ok) {
      return result.failure.message;
    }

    notify.success("Product archived", {
      description: `${productName} stays on historical invoices and can be restored.`,
    });
    router.refresh();

    return null;
  }

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <RowActionsTrigger label={`Actions for ${productName}`} />

        <DropdownMenuContent>
          <DropdownMenuItem
            icon={<Eye aria-hidden="true" />}
            onSelect={() => router.push(`/products/${productId}`)}
          >
            View details
          </DropdownMenuItem>

          {canUpdate ? (
            <>
              <DropdownMenuItem
                icon={<PencilLine aria-hidden="true" />}
                onSelect={() => router.push(`/products/${productId}/edit`)}
              >
                Edit product
              </DropdownMenuItem>

              <DropdownMenuItem
                icon={isActive ? <PowerOff aria-hidden="true" /> : <Power aria-hidden="true" />}
                onSelect={(event) => {
                  // Radix closes the menu on select and moves focus back to
                  // the trigger; preventing that lets the dialog take focus
                  // cleanly instead of fighting it.
                  event.preventDefault();
                  setStatusOpen(true);
                }}
              >
                {isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            </>
          ) : null}

          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                tone="danger"
                icon={<Archive aria-hidden="true" />}
                onSelect={(event) => {
                  event.preventDefault();
                  setArchiveOpen(true);
                }}
              >
                Archive product
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Controlled, so they can be opened from a menu item without needing a
          visible trigger of their own. */}
      <ConfirmDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        tone="primary"
        title={isActive ? "Deactivate product?" : "Activate product?"}
        confirmLabel={isActive ? "Deactivate" : "Activate"}
        description={
          isActive
            ? `"${productName}" stays in the catalog but cannot be added to new invoices.`
            : `"${productName}" becomes available for new invoices again.`
        }
        onConfirm={toggleStatus}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive product?"
        confirmLabel="Archive"
        description={`"${productName}" will be hidden from the catalog. It stays on historical invoices and can be restored later.`}
        onConfirm={archive}
      />
    </div>
  );
}
