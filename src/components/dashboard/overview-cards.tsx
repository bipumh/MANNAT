import {
  CheckSquare,
  DollarSign,
  FileText,
  FolderKanban,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Panel } from "@/components/dashboard/panel";
import type { DashboardOverview } from "@/lib/dashboard/queries";
import { formatCurrencyPrecise, formatDuration } from "@/lib/format";

type KpiCard = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
};

export function OverviewCards({ overview }: { overview: DashboardOverview }) {
  const cards: KpiCard[] = [
    {
      label: "Total revenue",
      value: formatCurrencyPrecise(overview.totalRevenue),
      hint: "Paid invoices",
      icon: DollarSign,
    },
    {
      label: "Outstanding",
      value: formatCurrencyPrecise(overview.outstanding),
      hint: "Sent + overdue",
      icon: FileText,
    },
    {
      label: "Active clients",
      value: String(overview.activeClients),
      hint: "Active accounts",
      icon: Users,
    },
    {
      label: "Active projects",
      value: String(overview.activeProjects),
      hint: "In progress",
      icon: FolderKanban,
    },
    {
      label: "Open tasks",
      value: String(overview.openTasks),
      hint: "Not completed",
      icon: CheckSquare,
    },
    {
      label: "Time this month",
      value: formatDuration(overview.trackedMinutes),
      hint: "Current month",
      icon: Timer,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Panel
          key={card.label}
          className="p-5 transition-colors hover:border-line-strong"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-line-strong bg-surface-2 text-primary">
            <card.icon className="h-5 w-5" />
          </span>

          <p className="mt-4 text-sm text-muted">{card.label}</p>

          <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
            {card.value}
          </p>

          <p className="mt-1 text-xs text-dim">{card.hint}</p>
        </Panel>
      ))}
    </div>
  );
}
