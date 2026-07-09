"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import {  createContext,
  useCallback,
  useContext,
  useEffect,
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
  action?: { label: string; href: string };
}

interface ToastContextValue {
  toast: (data: Omit<ToastData, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  default: "border-bordure bg-elevated",
  success: "border-vert-energie/40 bg-vert-energie/10",
  error: "border-red-500/40 bg-red-500/10",
  warning: "border-or-solaire/40 bg-or-solaire/10",
  premium: "border-or-solaire/50 bg-or-solaire/15",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        {mounted
          ? toasts.map((t) => (
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
                <ToastPrimitive.Title className="text-sm font-semibold text-texte-principal">
                  {t.title}
                </ToastPrimitive.Title>
                {t.description ? (
                  <ToastPrimitive.Description className="mt-1 text-sm text-texte-secondaire">
                    {t.description}
                  </ToastPrimitive.Description>
                ) : null}
                {t.action ? (
                  <a
                    href={t.action.href}
                    className="mt-3 inline-flex rounded-md border border-or-solaire/40 bg-or-solaire/10 px-3 py-1.5 text-xs font-semibold text-texte-principal transition-colors hover:bg-or-solaire/20"
                  >
                    {t.action.label}
                  </a>
                ) : null}
                <ToastPrimitive.Close
                  className="absolute right-2 top-2 rounded p-1 text-texte-secondaire hover:text-texte-principal focus-visible:outline focus-visible:outline-2 focus-visible:outline-vert-energie"
                  aria-label="Fermer la notification"
                >
                  ×
                </ToastPrimitive.Close>
              </ToastPrimitive.Root>
            ))
          : null}
        {mounted ? (
          <ToastPrimitive.Viewport
            className={cn(
              "fixed bottom-4 right-4 z-[100] flex max-h-screen w-full flex-col gap-2",
              "md:max-w-[420px]",
            )}
            label="Notifications"
          />
        ) : null}
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
