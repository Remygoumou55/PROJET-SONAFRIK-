"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ items, defaultValue, value, onValueChange, className }: TabsProps) {
  const defaultTab = defaultValue ?? items[0]?.value;

  return (
    <TabsPrimitive.Root
      defaultValue={defaultTab}
      value={value}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      <TabsPrimitive.List
        className={cn(
          "flex gap-1 overflow-x-auto border-b border-[var(--t8-border-default)] pb-px",
          "scrollbar-none",
        )}
        aria-label="Onglets"
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              "shrink-0 px-4 py-2.5 text-sm font-medium transition-all duration-300",
              "text-[var(--t8-silver-deep)] hover:text-[var(--t8-pearl)]",
              "border-b-2 border-transparent",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--t8-primary-lavender)]",
              "data-[state=active]:border-[var(--t8-primary-lavender)] data-[state=active]:text-[var(--t8-primary-lavender)]",
              "disabled:pointer-events-none disabled:opacity-50",
              "min-h-[44px]",
            )}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.value}
          value={item.value}
          className="mt-4 focus-visible:outline-none"
          tabIndex={0}
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

export { TabsPrimitive };
