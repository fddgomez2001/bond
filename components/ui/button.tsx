import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "gold" | "outline" | "ghost" | "outline-light";
type Size = "sm" | "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary: "bg-bond-slate text-white hover:bg-[#2c3a3a] shadow-sm",
  secondary: "bg-white text-bond-slate hover:bg-bond-cream shadow-sm",
  gold: "bg-bond-yellow text-bond-ink hover:bg-bond-gold shadow-sm",
  outline: "border border-bond-slate/25 bg-white text-bond-slate hover:border-bond-slate/50 hover:bg-bond-cream",
  "outline-light": "border border-white/60 text-white hover:bg-white/10",
  ghost: "text-bond-slate hover:bg-bond-slate/10",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm rounded-xl",
  md: "h-11 px-5 text-[0.95rem] rounded-xl",
  lg: "h-12 px-6 text-base rounded-2xl",
  xl: "h-14 px-8 text-lg rounded-full sm:h-[70px] sm:px-10 sm:text-[1.4rem]",
};

/** Class string for buttons, so links can share the exact same look. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors duration-200",
    "disabled:pointer-events-none disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingText?: string;
};

export function Button({
  variant,
  size,
  loading = false,
  loadingText,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Spinner className="size-4" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
