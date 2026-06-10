import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

const badgeVariants = cva(
  [
    "inline-flex items-center justify-center gap-1",
    "rounded-full font-medium whitespace-nowrap",
    "transition-all duration-300 ease-in-out",
  ],
  {
    variants: {
      variant: {
        default: "bg-surface text-texte-principal border border-bordure",
        primary: "bg-vert-energie/15 text-vert-energie border border-vert-energie/30",
        premium: "bg-or-solaire/15 text-or-solaire border border-or-solaire/30",
        verified: "bg-vert-profond/20 text-vert-energie",
        legend: "bg-or-solaire/20 text-or-solaire shadow-[0_0_12px_rgba(255,194,14,0.2)]",
        founder: "bg-or-profond/20 text-or-solaire border border-or-profond/40",
        outline: "border border-bordure text-texte-secondaire bg-transparent",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
        lg: "px-3 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };
