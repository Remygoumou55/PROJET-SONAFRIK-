import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

const cardVariants = cva(
  [
    "rounded-xl border border-bordure bg-card text-texte-principal",
    "transition-all duration-300 ease-in-out",
  ],
  {
    variants: {
      variant: {
        default: "shadow-md",
        elevated: "bg-elevated shadow-lg",
        interactive:
          "cursor-pointer hover:border-vert-energie/50 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-vert-energie",
        premium: "border-or-solaire/30 shadow-[0_0_20px_rgba(255,194,14,0.15)]",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4 md:p-5",
        lg: "p-6 md:p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  },
);

export interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, padding }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 pb-4", className)} {...props} />;
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { children: ReactNode }) {
  return (
    <h3 className={cn("text-lg font-semibold leading-none", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-texte-secondaire", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center pt-4", className)} {...props} />;
}

export { cardVariants };
