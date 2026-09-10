"use client";

import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Dropdown menu, built on Radix.
 *
 * Radix supplies roving focus, typeahead, Escape/outside-click dismissal,
 * collision-aware positioning and the correct `menu`/`menuitem` roles -- all of
 * which a hand-rolled action menu tends to miss, leaving it unusable by
 * keyboard.
 */

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;

export function DropdownMenuContent({
  children,
  align = "end",
  className,
}: {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        align={align}
        sideOffset={6}
        collisionPadding={12}
        className={cn(
          "z-50 min-w-[11rem] overflow-hidden rounded-lg border border-border bg-surface p-1",
          "shadow-popover focus:outline-none",
          className,
        )}
        style={{ animation: "jp-menu-in 120ms var(--ease-out-quart)" }}
      >
        {children}
      </MenuPrimitive.Content>
    </MenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  children,
  onSelect,
  tone = "default",
  disabled,
  icon,
}: {
  children: React.ReactNode;
  onSelect?: (event: Event) => void;
  tone?: "default" | "danger";
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <MenuPrimitive.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2",
        "text-[0.8125rem] outline-none transition-colors",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg]:size-3.5 [&_svg]:shrink-0",
        tone === "danger"
          ? "text-danger-700 data-[highlighted]:bg-danger-50"
          : "text-fg-muted data-[highlighted]:bg-surface-hover data-[highlighted]:text-fg",
      )}
    >
      {icon}
      {children}
    </MenuPrimitive.Item>
  );
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <MenuPrimitive.Label className="px-2.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-fg-subtle">
      {children}
    </MenuPrimitive.Label>
  );
}

export function DropdownMenuSeparator() {
  return <MenuPrimitive.Separator className="my-1 h-px bg-border" />;
}

/**
 * The standard row-actions trigger. `asChild` keeps our Button as the real
 * element so styling and the accessible name stay in one place.
 */
export function RowActionsTrigger({ label = "Open actions menu" }: { label?: string }) {
  return (
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label={label}>
        <MoreHorizontal aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
  );
}
