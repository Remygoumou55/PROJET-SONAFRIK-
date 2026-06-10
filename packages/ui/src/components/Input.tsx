import { cva, type VariantProps } from "class-variance-authority";
import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const inputVariants = cva(
  [
    "w-full rounded-lg border bg-surface text-texte-principal",
    "placeholder:text-texte-desactive",
    "transition-all duration-300 ease-in-out",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vert-energie",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "min-h-[44px] px-4 py-2 text-base",
  ],
  {
    variants: {
      variant: {
        default: "border-bordure focus:border-vert-energie",
        error: "border-red-500 focus:border-red-500 focus-visible:outline-red-500",
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
}

export function Input({
  className,
  variant,
  inputSize,
  label,
  error,
  hint,
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
        <label htmlFor={inputId} className="text-sm font-medium text-texte-principal">
          {label}
          {required ? <span className="text-vert-energie ml-0.5">*</span> : null}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(inputVariants({ variant: error ? "error" : variant, inputSize }), className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
        aria-required={required}
        required={required}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="text-sm text-texte-secondaire">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export { inputVariants };
