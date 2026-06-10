import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ImgHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const avatarVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
    "rounded-full bg-elevated text-texte-principal font-semibold",
    "border border-bordure",
  ],
  {
    variants: {
      size: {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-14 w-14 text-base",
        xl: "h-20 w-20 text-lg",
        "2xl": "h-28 w-28 text-2xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface AvatarProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt: string;
  fallback?: string;
  imgProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({
  className,
  size,
  src,
  alt,
  fallback,
  imgProps,
  ...props
}: AvatarProps) {
  const initials = fallback ?? getInitials(alt);

  return (
    <div
      className={cn(avatarVariants({ size }), className)}
      role="img"
      aria-label={alt}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          {...imgProps}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </div>
  );
}

export { avatarVariants };
