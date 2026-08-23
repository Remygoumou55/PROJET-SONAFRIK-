import { cva, type VariantProps } from "class-variance-authority";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

const inputVariants = cva(
  [
    "w-full rounded-lg border bg-[var(--t8-surface-01)] text-[var(--t8-pearl)]",
    "placeholder:text-[var(--t8-silver-deep)]",
    "transition-all duration-300 ease-in-out",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--t8-primary-lavender)]",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "min-h-[44px] px-4 py-2 text-base",
  ],
  {
    variants: {
      variant: {
        default: "border-[var(--t8-border-default)] focus:border-[var(--t8-primary-lavender)]",
        error: "border-[var(--t8-error)] focus:border-[var(--t8-error)] focus-visible:outline-[var(--t8-error)]",
        success: "border-[var(--t8-success)] focus:border-[var(--t8-success)]",
      },
      inputSize: {
        sm: "min-h-[36px] px-3 py-1.5 text-sm",
        md: "min-h-[44px] px-4 py-2",
        lg: "min-h-[52px] px-5 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  },
);

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string;
  hint?: string;
  suffix?: ReactNode;
}

export function Input({
  className,
  variant,
  inputSize,
  label,
  error,
  hint,
  suffix,
  id,
  required,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? `input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const hintId = hint && inputId ? `${inputId}-hint` : undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--t8-pearl)]">
          {label}
          {required ? <span className="text-[var(--t8-soft-rose)] ml-0.5">*</span> : null}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={inputId}
          className={cn(
            inputVariants({ variant: error ? "error" : variant, inputSize }),
            suffix ? "pr-10" : undefined,
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
          aria-required={required}
          required={required}
          {...props}
        />
        {suffix ? (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            {suffix}
          </div>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-[var(--t8-error)]" role="alert">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="text-sm text-[var(--t8-silver)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export { inputVariants };
