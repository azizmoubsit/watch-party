import * as React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  variant = "info",
  title,
  children,
  onDismiss,
  className,
}: AlertProps) {
  const icons = {
    info: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  };

  const variantStyles = {
    info: "bg-indigo-950/40 border-indigo-500/30 text-indigo-200",
    success: "bg-emerald-950/40 border-emerald-500/30 text-emerald-200",
    warning: "bg-amber-950/40 border-amber-500/30 text-amber-200",
    error: "bg-rose-950/40 border-rose-500/30 text-rose-200",
  };

  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border p-4 text-xs flex items-start gap-3 shadow-lg transition-all",
        variantStyles[variant],
        className
      )}
    >
      {icons[variant]}

      <div className="flex-1 space-y-1">
        {title && <h4 className="font-semibold text-white">{title}</h4>}
        <div className="leading-relaxed text-slate-300">{children}</div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
