import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  // Shared: consistent height rhythm, no layout shift between variants
  // (every variant carries a border, transparent where not needed).
  cn(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md border font-medium transition-colors duration-150",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        primary: cn(
          "border-primary-600 bg-primary-600 text-fg-inverted shadow-xs",
          "hover:border-primary-700 hover:bg-primary-700",
          "active:bg-primary-800",
        ),
        secondary: cn(
          "border-border-strong bg-surface text-fg shadow-xs",
          "hover:bg-surface-hover",
          "active:bg-surface-inset",
        ),
        ghost: cn(
          "border-transparent bg-transparent text-fg-muted",
          "hover:bg-surface-hover hover:text-fg",
        ),
        danger: cn(
          "border-danger-600 bg-danger-600 text-fg-inverted shadow-xs",
          "hover:border-danger-700 hover:bg-danger-700",
        ),
        "danger-subtle": cn(
          "border-danger-100 bg-danger-50 text-danger-700",
          "hover:border-danger-600/30 hover:bg-danger-100",
        ),
        link: cn(
          "h-auto border-transparent p-0 text-primary-600 underline-offset-4",
          "hover:text-primary-700 hover:underline",
        ),
      },
      size: {
        sm: "h-8 px-2.5 text-[0.8125rem] [&_svg]:size-3.5",
        md: "h-9 px-3.5 text-sm [&_svg]:size-4",
        lg: "h-10 px-4 text-sm [&_svg]:size-4",
        icon: "size-9 p-0 [&_svg]:size-4",
        "icon-sm": "size-8 p-0 [&_svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /**
     * Shows a spinner and disables the button. Kept separate from `disabled`
     * so a caller can express "busy" without losing the reason it is disabled.
     */
    loading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  loading = false,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      // Defaults to "button": a bare <button> inside a form submits it, which
      // is a common source of accidental submissions.
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

/**
 * A link that looks like a button.
 *
 * Kept as a separate component rather than adding `asChild` (and therefore a
 * Slot dependency) to Button: a navigation control should render an <a> so
 * middle-click, copy-link and keyboard activation all behave natively.
 */
export function ButtonLink({
  href,
  className,
  variant,
  size,
  children,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  VariantProps<typeof buttonVariants> & { href: string }) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Link>
  );
}

export { buttonVariants };
