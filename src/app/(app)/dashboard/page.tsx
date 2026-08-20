import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/current-user";

export const metadata: Metadata = {
  title: "Dashboard · JPopular",
};

/**
 * Placeholder. Real dashboard tiles (today's sales, outstanding payments,
 * low stock) arrive in a later slice -- this exists to prove authentication and
 * permission loading work end to end.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null; // the layout already redirected
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Signed in as {user.email}. Business features arrive in later slices.
        </p>
      </header>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Your access</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {user.roles.join(", ") || "No role assigned"} — {user.permissions.length} permissions
          granted.
        </p>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {user.permissions.map((permission) => (
            <li
              key={permission}
              className="rounded-full border border-line bg-canvas px-2 py-0.5 font-mono text-xs text-ink-muted"
            >
              {permission}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
