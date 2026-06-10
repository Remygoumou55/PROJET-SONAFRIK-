"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "full";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  full: "max-w-[95vw] md:max-w-3xl",
} as const;

export function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-noir-profond/80 transition-opacity duration-300" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-bordure bg-elevated p-6 shadow-xl",
            "duration-300 focus:outline-none",
            sizeClasses[size],
          )}
        >
          <Dialog.Title className="text-lg font-semibold text-texte-principal">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-2 text-sm text-texte-secondaire">
              {description}
            </Dialog.Description>
          ) : null}
          <div className="mt-4">{children}</div>
          {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
          <Dialog.Close
            className="absolute right-4 top-4 rounded-md p-1 text-texte-secondaire hover:text-texte-principal focus-visible:outline focus-visible:outline-2 focus-visible:outline-vert-energie"
            aria-label="Fermer"
          >
            <CloseIcon />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export { Dialog };
