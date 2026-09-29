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
import {
  SPOTLIGHT_AMBER,
  SPOTLIGHT_EMERALD,
  SPOTLIGHT_NEUTRAL,
} from "@/components/dashboard/spotlight";
import type { DashboardOverview } from "@/lib/dashboard/queries";
import { formatCurrencyPrecise, formatDuration } from "@/lib/format";

type Tone = "emerald" | "amber" | "neutral";

type KpiCard = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: Tone;
};

const toneStyles: Record<Tone, { tile: string; icon: string; spot: string }> = {
  emerald: {
    tile: "border-primary/25 bg-primary/10",
    icon: "text-primary-bright",
    spot: SPOTLIGHT_EMERALD,
  },
  amber: {
    tile: "border-amber-500/25 bg-amber-500/10",
    icon: "text-amber-300",
    spot: SPOTLIGHT_AMBER,
  },
  neutral: {
    tile: "border-line-strong bg-surface-3",
    icon: "text-muted",
    spot: SPOTLIGHT_NEUTRAL,
  },
};

export function OverviewCards({ overview }: { overview: DashboardOverview }) {
  const cards: KpiCard[] = [
    {
      label: "Total revenue",
      value: formatCurrencyPrecise(overview.totalRevenue),
      hint: "Paid invoices",
      icon: DollarSign,
      tone: "emerald",
    },
    {
      label: "Outstanding",
      value: formatCurrencyPrecise(overview.outstanding),
      hint: "Sent + overdue",
      icon: FileText,
      tone: "amber",
    },
    {
      label: "Active clients",
      value: String(overview.activeClients),
      hint: "Active accounts",
      icon: Users,
      tone: "neutral",
    },
    {
      label: "Active projects",
      value: String(overview.activeProjects),
      hint: "In progress",
      icon: FolderKanban,
      tone: "neutral",
    },
    {
      label: "Open tasks",
      value: String(overview.openTasks),
      hint: "Not completed",
      icon: CheckSquare,
      tone: "neutral",
    },
    {
      label: "Time this month",
      value: formatDuration(overview.trackedMinutes),
      hint: "Current month",
      icon: Timer,
      tone: "emerald",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const tone = toneStyles[card.tone];
        return (
          <Panel
            key={card.label}
            spotlight
            spotlightColor={tone.spot}
            className="p-5"
          >
            <div className="flex items-start justify-between">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl border ${tone.tile}`}
              >
                <card.icon className={`h-5 w-5 ${tone.icon}`} />
              </span>
            </div>

            <p className="mt-5 text-xs font-medium uppercase tracking-wider text-dim">
              {card.label}
            </p>

            <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
              {card.value}
            </p>

            <p className="mt-1 text-xs text-dim">{card.hint}</p>
          </Panel>
        );
      })}
    </div>
  );
}
