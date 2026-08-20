"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/controls";
import { useAuth } from "@/features/auth/AuthProvider";

export function Topbar() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    setIsSigningOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      // Navigate regardless: the cookie is cleared server-side even if the
      // token was already invalid.
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{user.name}</p>
        <p className="truncate text-xs text-ink-subtle">
          {user.roles.length > 0 ? user.roles.join(", ") : "no role assigned"}
        </p>
      </div>

      <Button variant="secondary" onClick={handleLogout} disabled={isSigningOut}>
        {isSigningOut ? "Signing out…" : "Sign out"}
      </Button>
    </header>
  );
}
