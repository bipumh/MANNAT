import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BarChart3, Download, Plus } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import {
  getBusinessPulse,
  getDashboardActivity,
  getDashboardInvoices,
  getDashboardOverview,
  getDashboardProjects,
  getDashboardRevenue,
  getDashboardTasks,
} from "@/lib/dashboard/queries";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { EmptyState } from "@/components/ui/empty-state";
import { DashboardReveal } from "@/components/dashboard/dashboard-reveal";
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

  const firstName = user.fullName.split(" ")[0] || user.fullName;

  const [
    overview,
    pulse,
    revenueData,
    projects,
    tasks,
    invoicesData,
    activityEvents,
  ] = await Promise.all([
    getDashboardOverview(user.workspaceId),
    getBusinessPulse(user.workspaceId),
    getDashboardRevenue(user.workspaceId),
    getDashboardProjects(user.workspaceId, 5),
    getDashboardTasks(user.workspaceId, 5),
    getDashboardInvoices(user.workspaceId, 5),
    getDashboardActivity(user.workspaceId, 6),
  ]);

  const hasRevenue = revenueData.some((point) => point.revenue > 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <DashboardReveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Good morning, {firstName}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Here&apos;s what&apos;s happening at {user.workspaceName} today.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="surface" size="sm">
              <Download aria-hidden className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm">
              <Plus aria-hidden className="h-4 w-4" />
              New project
            </Button>
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
          <Panel className="lg:col-span-2">
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
            {hasRevenue ? (
              <RevenueChart data={revenueData} className="w-full" />
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No paid revenue yet"
                description="Your revenue trend will appear here once invoices are paid."
              />
            )}
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
