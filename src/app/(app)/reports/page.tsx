import { ArrowUpRight, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { PermissionNotice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import type { Permission } from "@/features/auth/permissions";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { REPORTS } from "@/features/reporting/types";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.reportsView)) {
    return <PermissionNotice>You do not have permission to view reports.</PermissionNotice>;
  }

  // Only the reports this user may actually open. Hiding a card is cosmetic --
  // each report re-checks its own permission server-side.
  const available = REPORTS.filter((report) =>
    hasPermission(user.permissions, report.permission as Permission),
  );

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Reports"
        description="Figures come from finalized invoices and recorded payments, never from current product prices."
      />

      {available.length === 0 ? (
        <PermissionNotice>
          You do not have permission to view any individual report yet.
        </PermissionNotice>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((report) => (
            <Link key={report.href} href={report.href} className="block focus-visible:outline-none">
              <Card className="flex h-full flex-col gap-1 p-4 transition-colors hover:border-border-strong">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-fg">{report.title}</h2>
                  <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-fg-subtle" />
                </div>
                <p className="text-[0.8125rem] leading-relaxed text-fg-muted">
                  {report.description}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card className="flex items-start gap-3 p-4">
        <TrendingUp aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
        <p className="text-[0.8125rem] leading-relaxed text-fg-muted">
          Sales counts what was <span className="font-medium text-fg">invoiced</span>; payments
          counts what was <span className="font-medium text-fg">collected</span>. They are not the
          same number, and the difference is what the Outstanding report shows. Cancelled invoices
          are excluded from sales totals but can still be inspected with the status filter.
        </p>
      </Card>
    </div>
  );
}
