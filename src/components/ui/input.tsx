"use client";

import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { useId, useState, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Form controls.
 *
 * All three share one base so input, select and textarea line up on the same
 * 2.25rem rhythm with identical borders and focus treatment. `aria-invalid`
 * drives the error styling, so the visual state can never disagree with what a
 * screen reader is told.
 */
const controlBase = cn(
  "w-full rounded-md border border-border-strong bg-surface text-sm text-fg shadow-xs",
  "transition-colors duration-150",
  "placeholder:text-fg-subtle",
  "hover:border-fg-subtle/60",
  "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
  "disabled:cursor-not-allowed disabled:bg-surface-inset disabled:text-fg-subtle",
  "aria-[invalid=true]:border-danger-600 aria-[invalid=true]:ring-danger-600/15",
);

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlBase, "h-9 px-3", className)} {...props} />;
}

export function Textarea({ className, rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} className={cn(controlBase, "min-h-20 px-3 py-2 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          controlBase,
          // Room for the chevron; appearance-none so the native arrow does not
          // double up with ours.
          "h-9 cursor-pointer appearance-none pl-3 pr-9",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
      />
    </div>
  );
}

/**
 * Password field with a visibility toggle.
 *
 * The toggle is a real button with an accessible name that changes with state,
 * so it is reachable and understandable without sight of the icon.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  const hintId = useId();

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={cn(controlBase, "h-9 pl-3 pr-10", className)}
        aria-describedby={hintId}
        {...props}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={0}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-fg-subtle hover:bg-transparent hover:text-fg"
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
      <span id={hintId} className="sr-only">
        {visible ? "Password is visible" : "Password is hidden"}
      </span>
    </div>
  );
}

/** Search input with a leading icon, used by every list page filter bar. */
export function SearchInput({
  className,
  icon,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle [&_svg]:size-4">
        {icon}
      </span>
      <input type="search" className={cn(controlBase, "h-9 pl-9 pr-3", className)} {...props} />
    </div>
  );
}

/** Checkbox with its label, wired together so the whole row is clickable. */
export function Checkbox({
  label,
  description,
  className,
  id: providedId,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
}) {
  const generatedId = useId();
  const id = providedId ?? generatedId;

  return (
    <div className="flex items-start gap-2.5">
      <input
        id={id}
        type="checkbox"
        className={cn(
          "mt-0.5 size-4 shrink-0 cursor-pointer rounded border-border-strong",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-fg">
          {label}
        </label>
        {description ? <p className="mt-0.5 text-xs text-fg-subtle">{description}</p> : null}
      </div>
    </div>
  );
}
