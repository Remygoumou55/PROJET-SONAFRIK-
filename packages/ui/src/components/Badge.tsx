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
        default: "bg-[var(--t8-surface-02)] text-[var(--t8-pearl)] border border-[var(--t8-border-default)]",
        primary: "bg-[var(--t8-glow-lavender)] text-[var(--t8-primary-lavender)] border border-[var(--t8-border-hover)]",
        premium: "bg-[var(--t8-glow-cyan)] text-[var(--t8-audio-cyan)] border border-[var(--t8-border-audio)]",
        verified: "bg-[var(--t8-success-deep)] text-[var(--t8-success)]",
        legend: "bg-[var(--t8-surface-03)] text-[var(--t8-pearl)] border border-[var(--t8-border-premium)] shadow-[0_0_12px_var(--t8-glow-lavender)]",
        founder: "bg-[var(--t8-surface-elevated)] text-[var(--t8-pearl)] border border-[var(--t8-border-premium)]",
        outline: "border border-[var(--t8-border-default)] text-[var(--t8-silver)] bg-transparent",
        genre: "bg-[var(--t8-surface-03)] text-[var(--t8-silver)] border border-[var(--t8-border-default)] text-xs",
        nouveau: "bg-[var(--t8-glow-rose)] text-[var(--t8-soft-rose)] border border-[var(--t8-glow-rose)] text-xs font-bold tracking-wide",
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
