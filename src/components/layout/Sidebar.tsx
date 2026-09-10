"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLockup } from "@/components/layout/brand";
import { NAV_GROUPS, isNavItemActive } from "@/components/layout/nav-config";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/cn";

/**
 * Desktop sidebar.
 *
 * Navigation is filtered by PERMISSION, never by role name, so a Manager simply
 * never sees the Administration group.
 *
 * Hiding a link is cosmetic: typing the URL still reaches the server, which
 * returns 403. This is UX, not a security boundary.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { can, user } = useAuth();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <nav aria-label="Main navigation" className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 py-4 scrollbar-slim">
      {groups.map((group) => (
        <div key={group.heading ?? "root"} className="flex flex-col gap-0.5">
          {group.heading ? (
            <p className="px-2.5 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-fg-subtle">
              {group.heading}
            </p>
          ) : null}

          {group.items.map((item) => {
            const active = isNavItemActive(item, pathname);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2",
                  "text-[0.8125rem] transition-colors duration-150",
                  active
                    ? "bg-primary-50 font-medium text-primary-700"
                    : "text-fg-muted hover:bg-surface-hover hover:text-fg",
                )}
              >
                {/* A left rail marks the active item, so the state is not
                    carried by colour alone. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full transition-colors",
                    active ? "bg-primary-600" : "bg-transparent",
                  )}
                />
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    active ? "text-primary-600" : "text-fg-subtle group-hover:text-fg-muted",
                  )}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}

      {/* Account summary pinned to the bottom of the rail. */}
      <div className="mt-auto border-t border-border pt-3">
        <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2">
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-100 text-[0.6875rem] font-semibold text-primary-700"
          >
            {initials(user.name)}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-xs font-medium text-fg">{user.name}</div>
            <div className="truncate text-[0.6875rem] capitalize text-fg-subtle">
              {user.roles[0] ?? "no role"}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

/** Fixed desktop rail. Hidden below lg, where the drawer takes over. */
export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
        <Link href="/dashboard" className="rounded-md">
          <BrandLockup subtitle="Business Manager" />
        </Link>
      </div>
      <SidebarNav />
    </aside>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";

  return (first + last).toUpperCase();
}

export { initials };
