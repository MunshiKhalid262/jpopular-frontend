import Link from "next/link";

/**
 * Minimal table + pagination primitives.
 *
 * Deliberately hand-rolled rather than pulling in TanStack Table: sorting,
 * grouping and virtualisation are not needed yet, and the existing users table
 * already follows this shape. The dependency can be added later if a real grid
 * requirement appears.
 */

export function TableShell({ children, minWidth = "56rem" }: { children: React.ReactNode; minWidth?: string }) {
  return (
    // Wide tables scroll inside their own container so the page body never
    // scrolls sideways.
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 font-semibold ${align === "right" ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-subtle">
      {children}
    </thead>
  );
}

export function Td({
  children,
  align = "left",
  numeric = false,
  className = "",
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  numeric?: boolean;
  className?: string;
}) {
  return (
    <td
      className={
        `px-4 py-3 ${align === "right" ? "text-right" : "text-left"} ` +
        // tabular-nums keeps price columns aligned digit-for-digit.
        `${numeric ? "tabular-nums" : ""} ${className}`
      }
    >
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-ink-muted">
        {children}
      </td>
    </tr>
  );
}

/**
 * Server-rendered pagination: plain links so it works without JavaScript and
 * keeps the current filters via the caller-supplied query builder.
 */
export function Pagination({
  currentPage,
  lastPage,
  total,
  buildHref,
}: {
  currentPage: number;
  lastPage: number | null;
  total: number | null;
  buildHref: (page: number) => string;
}) {
  const pages = lastPage ?? 1;

  if (pages <= 1) {
    return (
      <p className="text-xs text-ink-subtle">
        {total ?? 0} {total === 1 ? "record" : "records"}
      </p>
    );
  }

  const previous = Math.max(1, currentPage - 1);
  const next = Math.min(pages, currentPage + 1);

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-ink-subtle">
        Page {currentPage} of {pages} · {total ?? 0} records
      </p>

      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={buildHref(previous)}
            className="rounded-[--radius-control] border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:bg-canvas"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-[--radius-control] border border-line px-3 py-1.5 text-sm text-ink-subtle">
            Previous
          </span>
        )}

        {currentPage < pages ? (
          <Link
            href={buildHref(next)}
            className="rounded-[--radius-control] border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:bg-canvas"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-[--radius-control] border border-line px-3 py-1.5 text-sm text-ink-subtle">
            Next
          </span>
        )}
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function PermissionNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-line bg-surface p-5 text-sm text-ink-muted">
      {children}
    </p>
  );
}

export function ErrorNotice({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger">
      {children}
    </p>
  );
}
