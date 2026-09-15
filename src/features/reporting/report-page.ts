import "server-only";

import type { Permission } from "@/features/auth/permissions";
import { PERMISSIONS, hasPermission } from "@/features/auth/permissions";
import type { Pagination } from "@/features/catalog/types";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/server-api";

/**
 * Shared plumbing for the report pages.
 *
 * Every report does the same four things -- build a query string from the URL,
 * fetch rows and a summary, derive the export URL from THE SAME query string,
 * and page the results. Doing it once here is what guarantees the Export
 * button cannot drift from the filters on screen.
 */

export type ReportResult<Row, Summary> = {
  rows: Row[];
  summary: Summary | null;
  meta: Pagination | null;
  period: { from: string; to: string; timezone: string } | null;
  error: string | null;
};

/** Builds a query string from the whitelisted filter keys present in the URL. */
export function reportQuery(
  params: Record<string, string | undefined>,
  keys: readonly string[],
  perPage = 50,
): URLSearchParams {
  const query = new URLSearchParams({ per_page: String(perPage) });

  if (params.page) {
    query.set("page", params.page);
  }

  for (const key of keys) {
    const value = params[key];

    if (value) {
      query.set(key, value);
    }
  }

  return query;
}

/**
 * The export URL for a report.
 *
 * Carries the same filters as the table but never `page` or `per_page`: an
 * export is the whole filtered dataset, not the slice currently on screen.
 */
export function exportHref(
  path: string,
  params: Record<string, string | undefined>,
  keys: readonly string[],
): string {
  const query = new URLSearchParams();

  for (const key of keys) {
    const value = params[key];

    if (value) {
      query.set(key, value);
    }
  }

  const search = query.toString();

  return `/api/v1${path}/export${search ? `?${search}` : ""}`;
}

/** Page links that preserve the current filters. */
export function pageHref(
  path: string,
  params: Record<string, string | undefined>,
  keys: readonly string[],
): (page: number) => string {
  return (page: number) => {
    const query = new URLSearchParams();

    for (const key of keys) {
      const value = params[key];

      if (value) {
        query.set(key, value);
      }
    }

    query.set("page", String(page));

    return `${path}?${query.toString()}`;
  };
}

export async function fetchReport<Row, Summary>(
  path: string,
  query: URLSearchParams,
): Promise<ReportResult<Row, Summary>> {
  try {
    const response = await apiFetch<Row[]>(`${path}?${query.toString()}`);

    return {
      rows: response.data,
      summary: (response.meta?.summary as Summary | undefined) ?? null,
      meta: (response.meta?.pagination as Pagination | undefined) ?? null,
      period: (response.meta?.period as ReportResult<Row, Summary>["period"]) ?? null,
      error: null,
    };
  } catch (error) {
    return {
      rows: [],
      summary: null,
      meta: null,
      period: null,
      error: error instanceof ApiError ? error.message : "Could not load this report.",
    };
  }
}

/** Whether the viewer may use the Export button. */
export function canExport(permissions: readonly string[]): boolean {
  return hasPermission(permissions, PERMISSIONS.reportsExport);
}

/** Both the section gate and the individual report's own permission. */
export function canViewReport(permissions: readonly string[], permission: Permission): boolean {
  return (
    hasPermission(permissions, PERMISSIONS.reportsView) && hasPermission(permissions, permission)
  );
}
