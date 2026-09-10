"use client";

import { Archive, PencilLine } from "lucide-react";
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
import { del } from "@/features/catalog/client";

/**
 * Row actions for categories and brands: edit, plus archive behind a
 * confirmation.
 *
 * The backend refuses to archive a category or brand that products still
 * reference (409 CATEGORY_IN_USE / BRAND_IN_USE). That message is surfaced
 * inside the dialog verbatim, so the operator learns *why* rather than seeing
 * a generic failure -- the server is the authority on whether this is allowed.
 */
export function SimpleRowActions({
  resource,
  id,
  name,
  editHref,
  canManage,
  inUseCount = 0,
}: {
  resource: "categories" | "brands";
  id: number;
  name: string;
  editHref: string;
  canManage: boolean;
  /** Shown in the dialog so the likely refusal is visible before confirming. */
  inUseCount?: number;
}) {
  const router = useRouter();
  const [archiveOpen, setArchiveOpen] = useState(false);

  if (!canManage) {
    return null;
  }

  const noun = resource === "categories" ? "category" : "brand";

  async function archive(): Promise<string | null> {
    const result = await del(`/${resource}/${id}`);

    if (!result.ok) {
      return result.failure.message;
    }

    notify.success(`${noun.charAt(0).toUpperCase() + noun.slice(1)} archived`, {
      description: name,
    });
    router.refresh();

    return null;
  }

  return (
    <div className="flex items-center justify-end">
      <DropdownMenu>
        <RowActionsTrigger label={`Actions for ${name}`} />

        <DropdownMenuContent>
          <DropdownMenuItem
            icon={<PencilLine aria-hidden="true" />}
            onSelect={() => router.push(editHref)}
          >
            Edit {noun}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            tone="danger"
            icon={<Archive aria-hidden="true" />}
            onSelect={(event) => {
              event.preventDefault();
              setArchiveOpen(true);
            }}
          >
            Archive {noun}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive ${noun}?`}
        confirmLabel="Archive"
        description={
          inUseCount > 0 ? (
            <>
              <strong className="font-medium text-fg">{name}</strong> is used by{" "}
              {inUseCount} product{inUseCount === 1 ? "" : "s"}. A {noun} in use
              cannot be archived — deactivate it instead so it stops appearing in
              new product forms.
            </>
          ) : (
            <>
              <strong className="font-medium text-fg">{name}</strong> will be
              archived. This can be undone by a developer, but the {noun} will no
              longer appear in the app.
            </>
          )
        }
        onConfirm={archive}
      />
    </div>
  );
}
