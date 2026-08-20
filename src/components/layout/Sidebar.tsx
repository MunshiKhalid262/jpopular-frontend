"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/features/auth/AuthProvider";
import { PERMISSIONS, type Permission } from "@/features/auth/permissions";

/**
 * Navigation is filtered by PERMISSION, never by role name, so a Manager simply
 * never sees Admin entries.
 *
 * Hiding a link is cosmetic: typing the URL still reaches the server, which
 * returns 403. This is UX, not a security boundary.
 */

type NavItem = {
  href: string;
  label: string;
  permission: Permission;
};

type NavGroup = {
  heading: string | null;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    heading: null,
    items: [{ href: "/dashboard", label: "Dashboard", permission: PERMISSIONS.dashboardView }],
  },
  {
    heading: "Administration",
    items: [{ href: "/users", label: "Users", permission: PERMISSIONS.usersView }],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { can } = useAuth();

  const groups = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => can(item.permission)),
  })).filter((group) => group.items.length > 0);

  return (
    <nav aria-label="Main" className="flex w-56 shrink-0 flex-col gap-6 border-r border-line bg-surface px-3 py-5">
      <div className="flex items-center gap-2.5 px-2">
        <span
          aria-hidden="true"
          className="grid h-8 w-8 place-items-center rounded-[--radius-control] bg-brand text-xs font-bold text-white"
        >
          JP
        </span>
        <span className="text-sm font-semibold tracking-tight text-ink">JPopular</span>
      </div>

      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.heading ?? "root"} className="flex flex-col gap-1">
            {group.heading ? (
              <p className="px-2 pb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-subtle">
                {group.heading}
              </p>
            ) : null}

            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={
                    "rounded-[--radius-control] px-2.5 py-2 text-sm transition-colors " +
                    (isActive
                      ? "bg-brand-soft font-medium text-brand-strong"
                      : "text-ink-muted hover:bg-canvas hover:text-ink")
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
