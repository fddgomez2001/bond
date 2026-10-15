import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClasses = (invalid?: boolean, className?: string) =>
  cn(
    // 16px on phones: iOS Safari zooms the page into any smaller input.
    "w-full rounded-xl border bg-white px-4 py-3 text-base text-bond-ink shadow-sm transition-[border-color,box-shadow] duration-300 sm:text-[0.95rem]",
    "placeholder:text-bond-ink/40 focus:outline-none focus:ring-4",
    invalid
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-bond-ink/15 focus:border-bond-slate focus:ring-bond-yellow/40",
    "disabled:cursor-not-allowed disabled:bg-bond-ink/5",
    className,
  );

export function Input({ invalid, className, ...props }: ComponentProps<"input"> & { invalid?: boolean }) {
  return <input aria-invalid={invalid || undefined} className={inputClasses(invalid, className)} {...props} />;
}

export function Textarea({
  invalid,
  className,
  ...props
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={inputClasses(invalid, cn("min-h-28 resize-y", className))}
      {...props}
    />
  );
}

/**
 * Label + control + hint/error. The control should set
 * aria-describedby={describedBy(id, …)} so screen readers announce the error.
 */
export function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-semibold text-bond-ink">
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-red-600">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-bond-ink/60">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function describedBy(id: string, error?: string, hint?: boolean) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
