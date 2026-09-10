import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";

export type Crumb = { label: string; href?: string };

/**
 * Breadcrumb trail. The current page is the last item and is not a link, and
 * carries `aria-current="page"`.
 */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex items-center gap-1 text-xs text-fg-subtle">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="truncate transition-colors hover:text-fg"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn("truncate", isLast && "font-medium text-fg-muted")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}

              {!isLast ? (
                <ChevronRight aria-hidden="true" className="size-3 shrink-0 text-border-strong" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Page heading block: title, supporting line, and a primary action.
 *
 * Deliberately restrained type sizes -- this is a business tool, so the heading
 * orients rather than announces.
 */
export function PageHeader({
  title,
  description,
  action,
  breadcrumbs,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: Crumb[];
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 ? <Breadcrumbs items={breadcrumbs} /> : null}

      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-fg">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-[0.8125rem] leading-relaxed text-fg-muted">
              {description}
            </p>
          ) : null}
        </div>

        {action ? <div className="flex shrink-0 items-center gap-2.5">{action}</div> : null}
      </div>
    </header>
  );
}

/**
 * Back link used at the top of form pages, so a half-filled form always has a
 * visible way out that is not the browser's back button.
 */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
    >
      <ChevronRight aria-hidden="true" className="size-3 rotate-180" />
      {children}
    </Link>
  );
}
