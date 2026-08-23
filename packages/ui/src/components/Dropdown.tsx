"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface DropdownItem {
  label: string;
  onSelect?: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  label?: string;
  align?: "start" | "center" | "end";
}

export function Dropdown({ trigger, items, label = "Menu", align = "end" }: DropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={8}
          className={cn(
            "z-50 min-w-[180px] overflow-hidden rounded-lg border border-[var(--t8-border-default)] bg-[var(--t8-surface-03)] p-1 shadow-lg",
            "duration-300",
          )}
          aria-label={label}
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none",
                "transition-colors duration-150",
                "focus:bg-[var(--t8-surface-02)] data-[highlighted]:bg-[var(--t8-surface-02)]",
                item.destructive ? "text-[var(--t8-error)]" : "text-[var(--t8-pearl)]",
                item.disabled && "pointer-events-none opacity-50",
              )}
            >
              {item.icon}
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export { DropdownMenu };
