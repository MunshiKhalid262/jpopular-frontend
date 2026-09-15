import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/**
 * A summary tile.
 *
 * Deliberately plain: a dashboard where every tile is a different colour makes
 * none of them mean anything. Tone is reserved for the one or two figures that
 * genuinely need attention, and the icon carries the identity instead.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "neutral" | "warning" | "danger";
  href?: string;
}) {
  const tones = {
    neutral: "text-fg-subtle",
    warning: "text-warning-600",
    danger: "text-danger-600",
  } as const;

  const body = (
    <Card
      className={cn(
        "flex h-full flex-col gap-1 p-4",
        href && "transition-colors hover:border-border-strong",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{label}</p>
        {Icon ? <Icon aria-hidden="true" className={cn("size-4 shrink-0", tones[tone])} /> : null}
      </div>

      <p
        className={cn(
          "num text-xl font-semibold tabular-nums",
          tone === "neutral" ? "text-fg" : tones[tone],
        )}
      >
        {value}
      </p>

      {hint ? <p className="text-xs leading-relaxed text-fg-muted">{hint}</p> : null}
    </Card>
  );

  return href ? (
    <Link href={href} className="block focus-visible:outline-none">
      {body}
    </Link>
  ) : (
    body
  );
}
