"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";

type ToastVariant = "default" | "success" | "error" | "warning" | "premium";

interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (data: Omit<ToastData, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  default: "border-[var(--t8-border-default)] bg-[var(--t8-surface-03)]",
  success: "border-[var(--t8-success)] bg-[var(--t8-success-deep)]",
  error: "border-[var(--t8-error)] bg-[var(--t8-error-deep)]",
  warning: "border-[var(--t8-warning)] bg-[var(--t8-warning-deep)]",
  premium: "border-[var(--t8-primary-lavender)] bg-[var(--t8-primary-lavender-deep)]",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback((data: Omit<ToastData, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...data, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            duration={t.duration ?? 4000}
            onOpenChange={(open) => {
              if (!open) removeToast(t.id);
            }}
            className={cn(
              "relative rounded-lg border p-4 pr-8 shadow-lg transition-opacity duration-300",
              variantStyles[t.variant ?? "default"],
            )}
          >
            <ToastPrimitive.Title className="text-sm font-semibold text-[var(--t8-pearl)]">
              {t.title}
            </ToastPrimitive.Title>
            {t.description ? (
              <ToastPrimitive.Description className="mt-1 text-sm text-[var(--t8-silver)]">
                {t.description}
              </ToastPrimitive.Description>
            ) : null}
            <ToastPrimitive.Close
              className="absolute right-2 top-2 rounded p-1 text-[var(--t8-silver)] hover:text-[var(--t8-pearl)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--t8-primary-lavender)]"
              aria-label="Fermer la notification"
            >
              ×
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport
          className={cn(
            "fixed bottom-4 right-4 z-[100] flex max-h-screen w-full flex-col gap-2",
            "md:max-w-[420px]",
          )}
          label="Notifications"
        />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast doit être utilisé dans ToastProvider");
  }
  return ctx;
}

export { ToastPrimitive };
