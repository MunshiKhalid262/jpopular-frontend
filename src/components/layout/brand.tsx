import { cn } from "@/lib/cn";

/**
 * The JPopular mark.
 *
 * A drawn glyph rather than an emoji or an icon-font character: it renders
 * identically everywhere, scales cleanly, and is the one place the brand
 * appears at large size. The bolt reads as "electric" without decoration.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg bg-primary-600 text-fg-inverted shadow-xs",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-4">
        <path
          d="M13.2 2.4 5.6 13.2a.6.6 0 0 0 .49.95h4.06l-1.35 6.3a.6.6 0 0 0 1.08.47l7.6-10.8a.6.6 0 0 0-.49-.95h-4.06l1.35-6.3a.6.6 0 0 0-1.08-.47Z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}

export function BrandLockup({
  className,
  subtitle,
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark />
      <div className="min-w-0 leading-tight">
        <div className="text-sm font-semibold tracking-tight text-fg">JPopular</div>
        {subtitle ? (
          <div className="truncate text-[0.6875rem] text-fg-subtle">{subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}
