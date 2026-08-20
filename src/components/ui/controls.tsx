import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";

const inputBase =
  "w-full rounded-[--radius-control] border border-line bg-surface px-3 py-2 text-sm text-ink " +
  "placeholder:text-ink-subtle disabled:cursor-not-allowed disabled:bg-canvas " +
  "aria-[invalid=true]:border-danger";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;

  return <input {...rest} className={`${inputBase} ${className}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;

  return <select {...rest} className={`${inputBase} ${className}`} />;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export function Button({ variant = "primary", className = "", ...rest }: ButtonProps) {
  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: "bg-brand text-white hover:bg-brand-strong",
    secondary: "border border-line bg-surface text-ink hover:bg-canvas",
    danger: "border border-danger/30 bg-danger-soft text-danger hover:bg-danger/10",
  };

  return (
    <button
      {...rest}
      className={
        "inline-flex items-center justify-center gap-2 rounded-[--radius-control] px-4 py-2 " +
        "text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 " +
        `${variants[variant]} ${className}`
      }
    />
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "danger";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-canvas text-ink-muted border-line",
    success: "bg-success-soft text-success border-success/20",
    danger: "bg-danger-soft text-danger border-danger/20",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Non-field-specific error, e.g. invalid credentials or a 409 conflict. */
export function FormAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-[--radius-control] border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger"
    >
      {message}
    </div>
  );
}
