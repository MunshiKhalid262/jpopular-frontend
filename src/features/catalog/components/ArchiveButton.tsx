"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { del } from "@/features/catalog/client";

/**
 * Archive (soft delete) a catalog record.
 *
 * The backend refuses to archive a category or brand that products still
 * reference, returning 409 with CATEGORY_IN_USE / BRAND_IN_USE. That message is
 * surfaced verbatim -- the server is the authority on whether this is allowed.
 */
export function ArchiveButton({
  resource,
  id,
  label,
  confirmMessage,
}: {
  resource: "categories" | "brands" | "products";
  id: number;
  label?: string;
  confirmMessage: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function archive() {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsPending(true);
    setError(null);

    const result = await del(`/${resource}/${id}`);

    setIsPending(false);

    if (!result.ok) {
      setError(result.failure.message);

      return;
    }

    router.refresh();
  }

  return (
    <span className="flex flex-col gap-1">
      <button
        type="button"
        onClick={archive}
        disabled={isPending}
        className="text-left text-sm font-medium text-danger transition-colors hover:underline disabled:opacity-60"
      >
        {isPending ? "Archiving…" : (label ?? "Archive")}
      </button>

      {error ? (
        <span role="alert" className="max-w-[20rem] text-xs text-danger">
          {error}
        </span>
      ) : null}
    </span>
  );
}
