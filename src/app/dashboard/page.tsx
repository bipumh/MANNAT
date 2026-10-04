import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/roles";
import {
  getBusinessPulse,
  getDashboardActivity,
  getDashboardInvoices,
  getDashboardOverview,
  getDashboardProjects,
  getDashboardRevenue,
  getDashboardTasks,
} from "@/lib/dashboard/queries";
import { formatCurrencyPrecise } from "@/lib/format";
import { listClients } from "@/lib/clients/queries";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { SPOTLIGHT_EMERALD } from "@/components/dashboard/spotlight";
import { EmptyState } from "@/components/ui/empty-state";
import { DashboardReveal } from "@/components/dashboard/dashboard-reveal";
import { NewProjectButton } from "@/components/dashboard/new-project-button";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { BusinessPulse } from "@/components/dashboard/business-pulse";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { TasksOverview } from "@/components/dashboard/tasks-overview";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canManage(user)) redirect("/dashboard/my-work");

  const firstName = user.fullName.split(" ")[0] || user.fullName;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const [
    overview,
    pulse,
    revenueData,
    projects,
    tasks,
    invoicesData,
    activityEvents,
    clients,
  ] = await Promise.all([
    getDashboardOverview(user.workspaceId),
    getBusinessPulse(user.workspaceId),
    getDashboardRevenue(user.workspaceId),
    getDashboardProjects(user.workspaceId, 5),
    getDashboardTasks(user.workspaceId, 5),
    getDashboardInvoices(user.workspaceId, 5),
    getDashboardActivity(user.workspaceId, 6),
    listClients(user.workspaceId),
  ]);

  const hasRevenue = revenueData.some((point) => point.revenue > 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardReveal>
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-10 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Workspace overview
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {greeting}, {firstName}
              </h1>
              <p className="mt-2 max-w-lg text-sm text-muted">
                Here&apos;s what&apos;s happening at {user.workspaceName} today.
              </p>
            </div>
            <div className="flex gap-2">
              <NewProjectButton clients={clients} />
            </div>
          </div>
        </div>
      </DashboardReveal>

      <DashboardReveal delay={0.05}>
        <OverviewCards overview={overview} />
      </DashboardReveal>

      <DashboardReveal delay={0.08}>
        <BusinessPulse items={pulse} />
      </DashboardReveal>

      <DashboardReveal delay={0.1}>
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel
            spotlight
            spotlightColor={SPOTLIGHT_EMERALD}
            className="relative overflow-hidden lg:col-span-2"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
            />
            <div className="relative">
              <PanelHeader
                title="Revenue"
                description="Monthly paid revenue"
                action={
                  <div className="flex items-center gap-4 text-xs text-dim">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-primary" />
                      Revenue
                    </span>
                  </div>
                }
              />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-3xl font-semibold tracking-tight text-foreground">
                  {formatCurrencyPrecise(overview.totalRevenue)}
                </span>
                <span className="text-xs text-dim">total paid revenue</span>
              </div>
              <div className="mt-4">
                {hasRevenue ? (
                  <RevenueChart data={revenueData} className="w-full" />
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="No paid revenue yet"
                    description="Your revenue trend will appear here once invoices are paid."
                  />
                )}
              </div>
            </div>
          </Panel>
          <ActivityFeed events={activityEvents} />
        </div>
      </DashboardReveal>

      <DashboardReveal delay={0.15}>
        <div className="grid gap-6 lg:grid-cols-3">
          <RecentProjects projects={projects} className="lg:col-span-2" />
          <TasksOverview tasks={tasks.tasks} needsAttention={tasks.needsAttention} />
        </div>
      </DashboardReveal>

      <DashboardReveal delay={0.2}>
        <RecentInvoices
          invoices={invoicesData.invoices}
          counts={invoicesData.counts}
          outstanding={overview.outstanding}
        />
      </DashboardReveal>
    </div>
  );
}
