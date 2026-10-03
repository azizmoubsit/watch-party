import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "warning" | "danger" | "slate";
}

export function Badge({
  className,
  variant = "primary",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    primary:
      "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    success:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning:
      "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger:
      "bg-rose-500/10 text-rose-400 border-rose-500/20",
    slate:
      "bg-slate-800 text-slate-300 border-slate-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide uppercase",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
