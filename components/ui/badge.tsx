import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      muted: "bg-muted text-muted-foreground",
      outline: "border border-border bg-background",
      success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
      warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
      info: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
      danger: "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
