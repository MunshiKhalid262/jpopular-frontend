"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { putJson } from "@/features/catalog/client";

/**
 * Quick activate/deactivate from the product list. Uses the dedicated
 * /products/{id}/status endpoint so the intent is explicit.
 */
export function ProductStatusToggle({
  productId,
  isActive,
}: {
  productId: number;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setIsPending(true);
    setError(null);

    const result = await putJson(`/products/${productId}/status`, { is_active: !isActive });

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
        onClick={toggle}
        disabled={isPending}
        className={
          "text-left text-sm font-medium transition-colors hover:underline disabled:opacity-60 " +
          (isActive ? "text-ink-muted" : "text-success")
        }
      >
        {isPending ? "Saving…" : isActive ? "Deactivate" : "Activate"}
      </button>

      {error ? (
        <span role="alert" className="max-w-[18rem] text-xs text-danger">
          {error}
        </span>
      ) : null}
    </span>
  );
}
