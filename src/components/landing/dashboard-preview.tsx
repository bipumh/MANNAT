import { BrandTile } from "@/components/brand/logo";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Sparkline } from "@/components/dashboard/sparkline";
import { activity, overview, projects, revenue } from "@/data/demo";
import { formatCurrency } from "@/lib/format";
import {
  BarChart3,
  CheckSquare,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: Users, label: "Clients" },
  { icon: FolderKanban, label: "Projects" },
  { icon: CheckSquare, label: "Tasks" },
  { icon: FileText, label: "Invoices" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Settings, label: "Settings" },
];

const kpis = [
  { label: "Revenue", value: formatCurrency(overview.revenue.value), spark: overview.revenue.spark, positive: true },
  { label: "Clients", value: overview.clients.value, spark: overview.clients.spark, positive: true },
  { label: "Projects", value: overview.projects.value, spark: overview.projects.spark, positive: true },
  { label: "Invoices", value: overview.invoices.value, spark: overview.invoices.spark, positive: false },
];

export function DashboardPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line-strong bg-surface shadow-lift",
        className,
      )}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-md border border-line bg-background px-3 py-1 text-[11px] text-faint">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          app.mannat.app/dashboard
        </div>
        <span className="shrink-0 rounded-full border border-line-strong bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted">
          Sample data
        </span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-44 shrink-0 border-r border-line bg-background-alt p-3 sm:block">
          <div className="flex items-center gap-2 rounded-md bg-surface-2 p-1.5">
            <BrandTile className="h-5 w-5 rounded-[6px]" />
            <span className="truncate text-[11px] font-medium text-foreground">
              Acme Studio
            </span>
          </div>
          <nav className="mt-3 space-y-0.5">
            {navItems.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px]",
                  item.active
                    ? "bg-primary-soft text-primary-bright"
                    : "text-muted",
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 bg-background">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-[12px] font-semibold text-foreground">Overview</p>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2 py-1 text-[10px] text-faint md:flex">
                <Search className="h-3 w-3" />
                Search
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-2 py-1 text-[10px] font-medium text-foreground">
                <Plus className="h-3 w-3 text-primary" />
                New
              </div>
              <div className="h-5 w-5 rounded-full bg-primary-soft text-center text-[9px] font-medium leading-5 text-primary-bright">
                MK
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {kpis.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-lg border border-line bg-surface p-2.5"
                >
                  <p className="text-[10px] text-faint">{kpi.label}</p>
                  <div className="mt-0.5 flex items-end justify-between gap-1">
                    <p className="text-[14px] font-semibold text-foreground">
                      {kpi.value}
                    </p>
                    <Sparkline
                      data={kpi.spark}
                      positive={kpi.positive}
                      className="h-5 w-12"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 rounded-lg border border-line bg-surface p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium text-foreground">
                  Revenue
                </p>
                <span className="text-[10px] text-primary-bright">+12.4%</span>
              </div>
              <RevenueChart data={revenue} className="w-full" interactive={false} />
            </div>

            <div className="mt-2 grid gap-2 lg:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface p-2.5">
                <p className="text-[11px] font-medium text-foreground">
                  Recent projects
                </p>
                <ul className="mt-2 space-y-1.5">
                  {projects.slice(0, 3).map((project) => (
                    <li
                      key={project.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="truncate text-[11px] text-muted">
                        {project.name}
                      </span>
                      <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-line">
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${project.progress}%` }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-line bg-surface p-2.5">
                <p className="text-[11px] font-medium text-foreground">
                  Activity
                </p>
                <ul className="mt-2 space-y-1.5">
                  {activity.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[8px] font-medium text-primary-bright">
                        {item.actorInitials}
                      </span>
                      <span className="truncate text-[11px] text-muted">
                        <span className="text-foreground">{item.actor}</span>{" "}
                        {item.action} {item.target}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
