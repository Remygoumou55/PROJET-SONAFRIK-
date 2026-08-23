import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-semibold text-sm sm:text-base",
    "rounded-xl transition-all duration-300 ease-in-out",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--t8-primary-lavender)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "min-h-[44px] min-w-[44px] px-4 py-2",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-[var(--t8-primary-lavender)] to-[var(--t8-primary-lavender-deep)] text-[var(--t8-pearl)] hover:brightness-105 active:scale-[0.98] shadow-[0_0_24px_var(--t8-glow-lavender)]",
        secondary:
          "bg-[var(--t8-surface-02)] text-[var(--t8-pearl)] border border-[var(--t8-border-default)] hover:bg-[var(--t8-surface-03)] hover:border-[var(--t8-border-hover)]",
        outline:
          "border-2 border-[var(--t8-primary-lavender)] text-[var(--t8-primary-lavender)] bg-transparent hover:bg-[var(--t8-glow-lavender)]",
        ghost: "text-[var(--t8-pearl)] hover:bg-[var(--t8-surface-03)]",
        premium:
          "bg-[var(--t8-audio-cyan)] text-[var(--t8-deep-black)] hover:bg-[var(--t8-audio-cyan-bright)] active:scale-[0.98]",
        destructive: "bg-[var(--t8-error)] text-[var(--t8-pearl)] hover:bg-[var(--t8-error-deep)]",
      },
      size: {
        sm: "min-h-[36px] px-3 py-1.5 text-sm",
        md: "min-h-[44px] px-4 py-2",
        lg: "min-h-[52px] px-6 py-3 text-lg",
        icon: "h-11 w-11 p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  isLoading = false,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled ?? isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span className="sr-only">Chargement…</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { buttonVariants };
