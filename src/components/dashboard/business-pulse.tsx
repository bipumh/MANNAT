import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import type { PulseItem, PulseSeverity } from "@/lib/dashboard/queries";
import { cn } from "@/lib/cn";

const severityMeta: Record<PulseSeverity, { icon: LucideIcon; className: string }> = {
  danger: { icon: AlertCircle, className: "text-red-300" },
  warning: { icon: AlertTriangle, className: "text-amber-300" },
  info: { icon: Info, className: "text-primary-bright" },
};

export function BusinessPulse({ items }: { items: PulseItem[] }) {
  return (
    <Panel>
      <PanelHeader
        title="Business pulse"
        description="What needs your attention right now."
      />

      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/50 px-4 py-3 text-sm text-muted">
          <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0 text-primary" />
          You&apos;re all caught up.
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const meta = severityMeta[item.severity];
            const Icon = meta.icon;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex h-full items-start gap-3 rounded-lg border border-line bg-surface-2/50 px-3 py-3 transition-colors hover:border-line-strong"
                >
                  <Icon
                    aria-hidden
                    className={cn("mt-0.5 h-4 w-4 shrink-0", meta.className)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground transition-colors">
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
