import { AlertCircle, Inbox, Lock } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Empty state, permission notice, error notice and skeletons.
 *
 * These exist as shared components because "no data yet", "not allowed" and
 * "request failed" are three genuinely different messages, and pages were
 * previously rendering all three as the same grey paragraph.
 */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 text-center", className)}>
      <div
        aria-hidden="true"
        className="mb-3 grid size-11 place-items-center rounded-full border border-border bg-surface-muted text-fg-subtle [&_svg]:size-5"
      >
        {icon ?? <Inbox />}
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-fg-subtle">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** Shown when the signed-in user lacks the permission for a page. */
export function PermissionNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-6 py-12 shadow-xs">
      <EmptyState icon={<Lock />} title="Access restricted" description={String(children)} />
    </div>
  );
}

/** Shown when a request failed. Carries the API's own message verbatim. */
export function ErrorNotice({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-danger-100 bg-danger-50 px-4 py-3.5",
        className,
      )}
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger-600" />
      <div className="min-w-0 text-[0.8125rem] leading-relaxed text-danger-700">{children}</div>
    </div>
  );
}

/** Inline form-level error, distinct from a per-field message. */
export function FormAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-danger-100 bg-danger-50 px-3.5 py-3 text-[0.8125rem] leading-relaxed text-danger-700"
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger-600" />
      <span className="min-w-0">{message}</span>
    </div>
  );
}

/* --------------------------------------------------------------- skeletons */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-inset", className)}
    />
  );
}

/**
 * Table loading placeholder shaped like the real table, so the layout does not
 * jump when data arrives.
 */
export function TableSkeleton({
  rows = 6,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs"
      role="status"
      aria-label="Loading"
    >
      <div className="flex gap-4 border-b border-border bg-surface-muted px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className={cn("h-3", i === 0 ? "w-40" : "w-20")} />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: columns }).map((_, c) => (
              <div key={c} className={cn(c === 0 ? "w-40" : "w-20")}>
                <Skeleton className="h-3.5" />
                {c === 0 ? <Skeleton className="mt-1.5 h-2.5 w-24" /> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading records…</span>
    </div>
  );
}

/** Page-level skeleton: header, filter bar, then a table. */
export function ListPageSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-3 w-64" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-9 w-full max-w-2xl" />
      <TableSkeleton columns={columns} />
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-6 w-56" />
      </div>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
        {[0, 1, 2].map((s) => (
          <div key={s} className="grid gap-6 border-b border-border py-6 first:pt-0 last:border-0 lg:grid-cols-[14rem_1fr]">
            <div>
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="mt-2 h-2.5 w-40" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[0, 1, 2, 3].map((f) => (
                <div key={f}>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-1.5 h-9 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
