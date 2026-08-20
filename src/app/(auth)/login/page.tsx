import type { Metadata } from "next";

import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in · JPopular",
};

/** Only same-origin absolute paths, so `?next=` cannot be an open redirect. */
function safeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <div className="mb-6 flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-[--radius-control] bg-brand text-sm font-bold text-white"
          >
            JP
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink">JPopular</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Business management for electric scooters, batteries, and accessories.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <LoginForm nextPath={safeNextPath(next)} />
      </div>

      <p className="mt-6 text-xs text-ink-subtle">
        Lost access? Ask an administrator to reset your password.
      </p>
    </div>
  );
}
