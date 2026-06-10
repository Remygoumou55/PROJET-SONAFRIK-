import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-semibold text-sm sm:text-base",
    "rounded-lg transition-all duration-300 ease-in-out",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vert-energie",
    "disabled:pointer-events-none disabled:opacity-50",
    "min-h-[44px] min-w-[44px] px-4 py-2",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-vert-energie text-noir-profond hover:bg-vert-profond active:scale-[0.98]",
        secondary: "bg-surface text-texte-principal border border-bordure hover:bg-elevated",
        outline:
          "border-2 border-vert-energie text-vert-energie bg-transparent hover:bg-vert-energie/10",
        ghost: "text-texte-principal hover:bg-elevated",
        premium:
          "bg-or-solaire text-noir-profond hover:bg-or-profond active:scale-[0.98]",
        destructive: "bg-red-600 text-white hover:bg-red-700",
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
