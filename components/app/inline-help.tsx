import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineHelpProps {
  children: React.ReactNode;
  variant?: "default" | "tip" | "warning";
  className?: string;
}

export function InlineHelp({ children, variant = "default", className }: InlineHelpProps) {
  const styles = {
    default: "border bg-muted text-muted-foreground",
    tip: "border border-amber-200 bg-amber-50 text-amber-900",
    warning: "border border-rose-200 bg-rose-50 text-rose-900"
  };

  return (
    <div className={cn("flex items-start gap-2 rounded-md px-3 py-2 text-sm leading-6", styles[variant], className)}>
      <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
