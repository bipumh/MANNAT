import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "border-line-strong bg-surface-2 text-muted",
        success: "border-primary/30 bg-primary-soft text-primary-bright",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        danger: "border-red-500/30 bg-red-500/10 text-red-300",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export function Badge({
  variant,
  className,
  children,
  dot,
}: VariantProps<typeof badgeVariants> & {
  className?: string;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {dot ? (
        <span
          aria-hidden
          className={cn("h-1.5 w-1.5 rounded-full", {
            "bg-muted": variant === "neutral" || !variant,
            "bg-primary-bright": variant === "success",
            "bg-amber-400": variant === "warning",
            "bg-red-400": variant === "danger",
          })}
        />
      ) : null}
      {children}
    </span>
  );
}
