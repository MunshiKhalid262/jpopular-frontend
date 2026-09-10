import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Table primitives.
 *
 * Hand-rolled rather than TanStack Table: there is no sorting, grouping or
 * virtualisation requirement yet, and these pages render at most 100 rows from
 * the server. The dependency can arrive when a real grid requirement does.
 */

export function TableContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-surface shadow-xs", className)}>
      {/* Wide tables scroll inside their own container, so the page body never
          scrolls sideways on a laptop. */}
      <div className="overflow-x-auto scrollbar-slim">{children}</div>
    </div>
  );
}

export function Table({
  children,
  minWidth = "60rem",
}: {
  children: React.ReactNode;
  minWidth?: string;
}) {
  return (
    <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
      {children}
    </table>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-border bg-surface-muted">
      <tr>{children}</tr>
    </thead>
  );
}

export function TH({
  children,
  align = "left",
  className,
  srOnly = false,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  /** For an actions column, where a visible header adds noise. */
  srOnly?: boolean;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-fg-subtle",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {srOnly ? <span className="sr-only">{children}</span> : children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function TR({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr className={cn("transition-colors hover:bg-surface-muted", className)}>{children}</tr>
  );
}

export function TD({
  children,
  align = "left",
  numeric = false,
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  numeric?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle text-[0.8125rem] text-fg-muted",
        align === "right" && "text-right",
        align === "center" && "text-center",
        numeric && "num",
        className,
      )}
    >
      {children}
    </td>
  );
}

/**
 * The dominant cell in a row: a strong primary line with quiet secondary text
 * beneath. Used for product name + model, and user name + email.
 */
export function TDPrimary({
  children,
  secondary,
  href,
}: {
  children: React.ReactNode;
  secondary?: React.ReactNode;
  href?: string;
}) {
  const primary = href ? (
    <Link
      href={href}
      className="font-medium text-fg transition-colors hover:text-primary-600 hover:underline"
    >
      {children}
    </Link>
  ) : (
    <span className="font-medium text-fg">{children}</span>
  );

  return (
    <td className="max-w-[22rem] px-4 py-3 align-middle text-[0.8125rem]">
      <div className="truncate">{primary}</div>
      {secondary ? <div className="mt-0.5 truncate text-xs text-fg-subtle">{secondary}</div> : null}
    </td>
  );
}

export function TableEmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16">
        {children}
      </td>
    </tr>
  );
}

/**
 * Monospaced code cell for SKUs, slugs and HSN codes.
 *
 * nowrap because a code broken across two lines ("DEMO-ACC-" / "CHG") is
 * harder to read than a slightly wider column.
 */
export function CodeText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("whitespace-nowrap font-mono text-xs text-fg-muted", className)}>
      {children}
    </span>
  );
}

/**
 * Server-rendered pagination: plain links, so it works without JavaScript and
 * preserves the caller's active filters via `buildHref`.
 */
export function Pagination({
  currentPage,
  lastPage,
  total,
  perPage,
  buildHref,
  label = "records",
}: {
  currentPage: number;
  lastPage: number | null;
  total: number | null;
  perPage?: number;
  buildHref: (page: number) => string;
  label?: string;
}) {
  const pages = lastPage ?? 1;
  const count = total ?? 0;

  const from = perPage ? (currentPage - 1) * perPage + 1 : null;
  const to = perPage ? Math.min(currentPage * perPage, count) : null;

  const summary =
    from !== null && to !== null && count > 0
      ? `Showing ${from}–${to} of ${count} ${label}`
      : `${count} ${count === 1 ? label.replace(/s$/, "") : label}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-muted px-4 py-3">
      <p className="text-xs text-fg-subtle">{summary}</p>

      {pages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center gap-1.5">
          <PageLink
            href={buildHref(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
            <span className="hidden sm:inline">Previous</span>
          </PageLink>

          <span className="px-2 text-xs text-fg-muted num">
            Page {currentPage} of {pages}
          </span>

          <PageLink
            href={buildHref(Math.min(pages, currentPage + 1))}
            disabled={currentPage >= pages}
            label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight aria-hidden="true" />
          </PageLink>
        </nav>
      ) : null}
    </div>
  );
}

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const base = cn(
    "inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium",
    "[&_svg]:size-3.5",
  );

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={cn(base, "cursor-not-allowed border-border bg-surface text-fg-subtle opacity-60")}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(base, "border-border-strong bg-surface text-fg shadow-xs hover:bg-surface-hover")}
    >
      {children}
    </Link>
  );
}
