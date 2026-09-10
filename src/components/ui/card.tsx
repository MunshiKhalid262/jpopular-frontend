import { cn } from "@/lib/cn";

/**
 * Surface panel. One border, one small shadow -- no nesting of elevated cards
 * inside elevated cards, which is what makes admin UIs look cluttered.
 */
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-xs",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-fg-subtle">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("border-t border-border bg-surface-muted px-5 py-3", className)}>
      {children}
    </div>
  );
}

/**
 * Definition row for detail views: label on the left, value on the right.
 */
export function DetailRow({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-border py-2.5 last:border-0">
      <dt className="shrink-0 text-[0.8125rem] text-fg-muted">{label}</dt>
      <dd
        className={cn(
          "min-w-0 text-right text-[0.8125rem] font-medium text-fg",
          mono && "font-mono text-xs",
        )}
      >
        {children}
      </dd>
    </div>
  );
}
