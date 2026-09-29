import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { SPOTLIGHT_EMERALD } from "@/components/dashboard/spotlight";
import type { PulseItem, PulseSeverity } from "@/lib/dashboard/queries";
import { cn } from "@/lib/cn";

const severityMeta: Record<
  PulseSeverity,
  { icon: LucideIcon; iconClass: string; tileClass: string; cardClass: string }
> = {
  danger: {
    icon: AlertCircle,
    iconClass: "text-red-300",
    tileClass: "border-red-500/25 bg-red-500/10",
    cardClass: "border-red-500/25 bg-red-500/5 hover:bg-red-500/10",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-300",
    tileClass: "border-amber-500/25 bg-amber-500/10",
    cardClass: "border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/10",
  },
  info: {
    icon: Info,
    iconClass: "text-primary-bright",
    tileClass: "border-primary/25 bg-primary/10",
    cardClass: "border-primary/25 bg-primary/5 hover:bg-primary/10",
  },
};

export function BusinessPulse({ items }: { items: PulseItem[] }) {
  return (
    <Panel spotlight spotlightColor={SPOTLIGHT_EMERALD}>
      <PanelHeader
        title="Business pulse"
        description="What needs your attention right now."
        action={
          <span aria-hidden className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
        }
      />

      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/50 px-4 py-3 text-sm text-muted">
          <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0 text-primary" />
          You&apos;re all caught up.
        </div>
      ) : (
        <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
            const meta = severityMeta[item.severity];
            const Icon = meta.icon;
            const primary = index === 0;
            return (
              <li
                key={item.id}
                className={primary ? "sm:col-span-2 xl:col-span-3" : undefined}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-full items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors",
                    meta.cardClass,
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                      meta.tileClass,
                    )}
                  >
                    <Icon
                      aria-hidden
                      className={cn("h-4 w-4", meta.iconClass)}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-dim">
                      {item.message}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
