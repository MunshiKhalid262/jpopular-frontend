"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Activate / deactivate a user.
 *
 * `disabledReason` reflects a backend rule in the UI, but the backend is
 * authoritative: it returns 409 with CANNOT_DEACTIVATE_SELF or
 * LAST_ACTIVE_ADMIN, and that message is surfaced verbatim below.
 */
export function UserStatusToggle({
  userId,
  isActive,
  disabledReason,
}: {
  userId: number;
  isActive: boolean;
  disabledReason: string | null;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message = (body as { message?: string } | null)?.message;

        setError(message ?? "Could not update this user.");

        return;
      }

      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setIsPending(false);
    }
  }

  if (disabledReason) {
    return (
      <span title={disabledReason} className="text-sm text-ink-subtle">
        {isActive ? "Deactivate" : "Activate"}
      </span>
    );
  }

  return (
    <span className="flex flex-col gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className={
          "text-left text-sm font-medium transition-colors disabled:opacity-60 " +
          (isActive ? "text-danger hover:underline" : "text-success hover:underline")
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
