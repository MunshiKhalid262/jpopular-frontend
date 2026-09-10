"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { KeyRound, LogOut, Menu, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { BrandLockup } from "@/components/layout/brand";
import { SidebarNav, initials } from "@/components/layout/Sidebar";
import { getRouteCrumbs, getRouteTitle } from "@/components/layout/nav-config";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/page-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/AuthProvider";
import { notify } from "@/components/ui/toast";

/**
 * Top bar: where you are, and who you are.
 *
 * The title and breadcrumbs come from the shared nav config rather than being
 * passed down by each page, so they cannot drift from the sidebar labels.
 */
export function Topbar() {
  const pathname = usePathname();
  const title = getRouteTitle(pathname);
  const crumbs = getRouteCrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur-md lg:px-6">
      <MobileNav />

      <div className="min-w-0 flex-1">
        {crumbs.length > 0 ? (
          <Breadcrumbs items={crumbs} />
        ) : (
          <h2 className="truncate text-sm font-semibold text-fg">{title}</h2>
        )}
      </div>

      <UserMenu />
    </header>
  );
}

/** Hamburger + slide-over drawer, below the lg breakpoint. */
function MobileNav() {
  const [open, setOpen] = useState(false);

  // Closing on navigation is handled by SidebarNav's onNavigate callback rather
  // than an effect watching the pathname: setting state inside an effect body
  // triggers a cascading render, and the click is the actual event we care
  // about. Escape and outside-click dismissal come from Radix.
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Open navigation" className="lg:hidden">
          <Menu aria-hidden="true" />
        </Button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-40 bg-fg/25 backdrop-blur-[2px] lg:hidden"
          style={{ animation: "jp-overlay-in 150ms var(--ease-out-quart)" }}
        />
        {/* Radix supplies the focus trap and Escape handling the drawer needs. */}
        <DialogPrimitive.Content
          className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-surface shadow-lg focus:outline-none lg:hidden"
        >
          <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
          <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
            <BrandLockup subtitle="Business Manager" />
          </div>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        notify.error("Could not sign out cleanly", {
          description: "Your local session was cleared anyway.",
        });
      }
    } catch {
      notify.error("Could not reach the server", {
        description: "Your local session was cleared anyway.",
      });
    } finally {
      // Navigate regardless: the cookie is cleared server-side even when the
      // token was already invalid.
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 transition-colors hover:bg-surface-hover"
          aria-label={`Account menu for ${user.name}`}
        >
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-100 text-[0.6875rem] font-semibold text-primary-700"
          >
            {initials(user.name)}
          </span>
          <span className="hidden max-w-[10rem] truncate text-[0.8125rem] font-medium text-fg sm:block">
            {user.name}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <div className="px-2.5 py-2">
          <p className="truncate text-[0.8125rem] font-medium text-fg">{user.name}</p>
          <p className="mt-0.5 truncate text-xs text-fg-subtle">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {user.roles.length > 0 ? (
              user.roles.map((role) => <RoleBadge key={role} role={role} size="sm" />)
            ) : (
              <span className="text-xs text-fg-subtle">No role assigned</span>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuItem icon={<UserRound aria-hidden="true" />} disabled>
          Profile (coming soon)
        </DropdownMenuItem>
        <DropdownMenuItem icon={<KeyRound aria-hidden="true" />} disabled>
          Change password (coming soon)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          tone="danger"
          icon={<LogOut aria-hidden="true" />}
          onSelect={(event) => {
            // Radix closes the menu on select; prevent that so the pending
            // state is visible until navigation happens.
            event.preventDefault();
            void handleLogout();
          }}
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Small helper for pages that want a "view docs"-style secondary link. */
export function TopbarLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-xs font-medium text-fg-muted hover:text-fg">
      {children}
    </Link>
  );
}
