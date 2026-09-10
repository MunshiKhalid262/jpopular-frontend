import { Battery, PackageSearch, ReceiptIndianRupee } from "lucide-react";
import type { Metadata } from "next";

import { BrandMark } from "@/components/layout/brand";
import { LoginForm } from "@/features/auth/components/LoginForm";

// The root layout's title template already appends "· JPopular".
export const metadata: Metadata = {
  title: "Sign in",
};

/** Only same-origin absolute paths, so `?next=` cannot be an open redirect. */
function safeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

const CAPABILITIES = [
  {
    icon: PackageSearch,
    title: "Catalog control",
    body: "Scooters, batteries and accessories with per-product GST and HSN codes.",
  },
  {
    icon: Battery,
    title: "Auditable stock",
    body: "Every movement recorded, so a balance can always be explained.",
  },
  {
    icon: ReceiptIndianRupee,
    title: "GST-ready billing",
    body: "Decimal-safe totals with CGST, SGST and IGST handled correctly.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    /* Split panel on desktop; the form panel alone on smaller screens.
       min-h-dvh rather than min-h-full: a percentage min-height depends on
       every ancestor resolving a height, which left a dead band at the bottom
       of the viewport. The dynamic viewport unit also accounts for mobile
       browser chrome. */
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* --- Form panel ------------------------------------------------- */}
      <div className="flex items-center justify-center bg-surface px-6 py-12 lg:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <BrandMark />
            <span className="text-base font-semibold tracking-tight text-fg">JPopular</span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-fg">Sign in</h1>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-fg-muted">
            Enter your credentials to access the business manager.
          </p>

          <div className="mt-7">
            <LoginForm nextPath={safeNextPath(next)} />
          </div>

          <p className="mt-7 border-t border-border pt-5 text-xs leading-relaxed text-fg-subtle">
            Lost access? Ask an administrator to reset your password. Accounts are
            created by an administrator — there is no self sign-up.
          </p>
        </div>
      </div>

      {/* --- Brand panel -------------------------------------------------
          Product context, not marketing. Hidden on small screens where the
          form is the only thing that matters. */}
      <div className="relative hidden overflow-hidden border-l border-border bg-primary-900 lg:flex lg:flex-col lg:justify-center">
        {/* A single restrained wash, not a gradient hero. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 78% 18%, var(--color-primary-300) 0, transparent 46%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-primary-100) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary-100) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="relative px-14 py-16">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary-300">
            Business Manager
          </p>
          <p className="mt-4 max-w-md text-2xl font-semibold leading-snug tracking-tight text-white">
            Run the shop floor and the paperwork from one place.
          </p>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-primary-100/80">
            Built for electric scooter and battery retail, with the GST detail an
            Indian small business actually needs.
          </p>

          <ul className="mt-10 flex flex-col gap-5">
            {CAPABILITIES.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.title} className="flex max-w-md items-start gap-3.5">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-primary-400/25 bg-primary-800/60 text-primary-200 [&_svg]:size-4"
                  >
                    <Icon />
                  </span>
                  <div>
                    <p className="text-[0.8125rem] font-medium text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-primary-100/70">
                      {item.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
