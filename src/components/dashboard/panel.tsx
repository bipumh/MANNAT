import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-line bg-surface p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div>
        <h3 className="font-display text-sm font-semibold text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="mt-0.5 text-xs text-dim">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
