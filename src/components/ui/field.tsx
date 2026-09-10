"use client";

import { useId } from "react";

import { cn } from "@/lib/cn";

type FieldRenderProps = {
  id: string;
  "aria-invalid": true | undefined;
  "aria-describedby": string | undefined;
  /**
   * Passed through so assistive tech is told the field is required, not just
   * shown a red asterisk. Deliberately aria-required rather than the native
   * `required` attribute: native validation would fire the browser's own
   * bubble and pre-empt our inline messages.
   */
  "aria-required": true | undefined;
};

/**
 * Label + control + helper text + error, wired for accessibility.
 *
 * The control receives `id`, `aria-invalid` and `aria-describedby` through a
 * render prop, which is what guarantees the label is actually associated and
 * that the error is announced -- rather than merely appearing in red.
 */
export function Field({
  label,
  error,
  hint,
  required,
  className,
  labelSuffix,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  /** e.g. a permission note or unit, shown right-aligned on the label row. */
  labelSuffix?: React.ReactNode;
  children: (props: FieldRenderProps) => React.ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  // Error takes precedence in the description, so a screen reader hears the
  // problem rather than the (now less relevant) hint.
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.8125rem] font-medium text-fg">
          {label}
          {required ? (
            <span className="ml-0.5 text-danger-600" aria-hidden="true">
              *
            </span>
          ) : null}
          {required ? <span className="sr-only"> (required)</span> : null}
        </label>
        {labelSuffix ? <span className="text-xs text-fg-subtle">{labelSuffix}</span> : null}
      </div>

      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-required": required ? true : undefined,
      })}

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger-700">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * A titled group of fields inside a form, so a long form reads as a few short
 * ones. Desktop puts the description in a left column and the fields on the
 * right; narrow screens stack.
 */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid gap-x-8 gap-y-5 border-b border-border py-6 first:pt-0 last:border-0 last:pb-0",
        "lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]",
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-fg-subtle">{description}</p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** Full-width child inside a FormSection's two-column grid. */
export function FieldSpan({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("sm:col-span-2", className)}>{children}</div>;
}

/**
 * Form action bar. Sticks to the bottom of the viewport on tall forms so the
 * primary action never scrolls out of reach.
 */
export function FormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 -mx-6 mt-2 flex items-center justify-end gap-3",
        "border-t border-border bg-surface/95 px-6 py-4 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
