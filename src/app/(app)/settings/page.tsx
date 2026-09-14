import type { Metadata } from "next";

import { ErrorNotice, PermissionNotice } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import { BusinessSettingsForm } from "@/features/invoicing/components/BusinessSettingsForm";
import type { BusinessSettings } from "@/features/invoicing/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  if (!hasPermission(user.permissions, PERMISSIONS.settingsView)) {
    return <PermissionNotice>You do not have permission to view settings.</PermissionNotice>;
  }

  // A manager may read these (they need the business name and GSTIN to raise
  // an invoice) but not change them.
  const canUpdate = hasPermission(user.permissions, PERMISSIONS.settingsUpdate);

  let settings: BusinessSettings;

  try {
    settings = (await apiFetch<BusinessSettings>("/settings/business")).data;
  } catch (error) {
    return (
      <ErrorNotice>
        {error instanceof ApiError ? error.message : "Could not load business settings."}
      </ErrorNotice>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Business settings"
        description={
          canUpdate
            ? "These appear on every invoice. The GST state code also decides how tax is split."
            : "These appear on every invoice. You have read-only access."
        }
      />

      <BusinessSettingsForm settings={settings} readOnly={!canUpdate} />
    </div>
  );
}
