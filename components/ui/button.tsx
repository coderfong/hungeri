import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-persimmon-500 text-white shadow-cta hover:bg-persimmon-600 disabled:bg-line-soft disabled:text-ink-300 disabled:shadow-none",
  secondary: "bg-persimmon-50 text-persimmon-500 hover:bg-persimmon-100",
  outline:
    "bg-surface text-ink-700 border-[1.5px] border-line hover:border-ink-300",
  ghost: "bg-transparent text-ink-500 hover:bg-line-soft",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-btn",
  md: "px-5 py-3 text-[15px] rounded-btn",
  lg: "px-6 py-4 text-base rounded-[14px]",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold transition-colors",
        "outline-none focus-visible:ring-4 focus-visible:ring-persimmon-100 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
