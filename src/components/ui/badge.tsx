import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

/**
 * Status badge.
 *
 * Tones are semantic only -- there is no "pick a colour" option, which is what
 * stops a status column turning into a rainbow. A dot is available for
 * active/inactive style states so colour is never the sole signal.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium",
  {
    variants: {
      tone: {
        neutral: "border-border bg-surface-inset text-fg-muted",
        primary: "border-primary-100 bg-primary-50 text-primary-700",
        success: "border-success-100 bg-success-50 text-success-700",
        warning: "border-warning-100 bg-warning-50 text-warning-700",
        danger: "border-danger-100 bg-danger-50 text-danger-700",
        info: "border-info-100 bg-info-50 text-info-700",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[0.6875rem]",
        md: "px-2 py-0.5 text-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

const dotTones: Record<NonNullable<VariantProps<typeof badgeVariants>["tone"]>, string> = {
  neutral: "bg-fg-subtle",
  primary: "bg-primary-600",
  success: "bg-success-600",
  warning: "bg-warning-600",
  danger: "bg-danger-600",
  info: "bg-info-600",
};

export type BadgeProps = VariantProps<typeof badgeVariants> & {
  children: React.ReactNode;
  /** Adds a leading status dot. */
  dot?: boolean;
  className?: string;
};

export function Badge({ tone = "neutral", size, dot = false, className, children }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)}>
      {dot ? (
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", dotTones[tone ?? "neutral"])}
        />
      ) : null}
      {children}
    </span>
  );
}

/**
 * The active/inactive badge used across products, categories, brands and users.
 * Centralised so the wording and colour never drift between modules.
 */
export function StatusBadge({ active, size }: { active: boolean; size?: BadgeProps["size"] }) {
  return (
    <Badge tone={active ? "success" : "neutral"} size={size} dot>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

/** Role badge for the users module. Admin is emphasised; manager is quiet. */
export function RoleBadge({ role, size }: { role: string; size?: BadgeProps["size"] }) {
  const label = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <Badge tone={role === "admin" ? "primary" : "neutral"} size={size}>
      {label}
    </Badge>
  );
}
