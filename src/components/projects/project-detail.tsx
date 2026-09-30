"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  FileText,
  Pencil,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { SPOTLIGHT_NEUTRAL } from "@/components/dashboard/spotlight";
import { InvoiceStatusBadge, ProjectPriorityBadge, ProjectStatusBadge, TaskStatusBadge } from "@/components/dashboard/status";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { ProjectTeam } from "@/components/projects/project-team";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";
import { WorkHistory } from "@/components/work-log/work-history";
import { formatBudget, formatCurrencyPrecise, formatDate, formatDateShort, formatDuration } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Client, Invoice, Project, Task, WorkLog, WorkspaceMember } from "@/types";
import type { ProjectFinancialStatus, ProjectProfitability } from "@/lib/projects/profitability";

const financialMeta: Record<
  ProjectFinancialStatus,
  { label: string; variant: "success" | "warning" | "danger" | "neutral" }
> = {
  "on-track": { label: "On track", variant: "success" },
  watch: { label: "Watch", variant: "warning" },
  "over-budget": { label: "Over budget", variant: "danger" },
  "no-budget": { label: "No budget", variant: "neutral" },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProjectDetail({
  project,
  clients,
  projects,
  tasks,
  invoices,
  profitability,
  assignedMembers,
  allMembers,
  canManage,
  workLogs,
}: {
  project: Project;
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  invoices: Invoice[];
  profitability: ProjectProfitability | null;
  assignedMembers: WorkspaceMember[];
  allMembers: WorkspaceMember[];
  canManage: boolean;
  workLogs: WorkLog[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newTask, setNewTask] = useState(false);
  const [newInvoice, setNewInvoice] = useState(false);

  const clientLabel = project.clientCompany
    ? `${project.clientName} — ${project.clientCompany}`
    : project.clientName;

  const overview = [
    { label: "Start date", value: project.startDate ? formatDate(project.startDate) : "—" },
    { label: "Due date", value: project.dueDate ? formatDate(project.dueDate) : "—" },
    { label: "Budget", value: formatBudget(project.budget) },
    { label: "Created", value: formatDate(project.createdAt) },
  ];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const openTasks = totalTasks - completedTasks;
  const overdueTasks = tasks.filter((t) => {
    if (t.status === "completed" || !t.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${t.dueDate}T00:00:00`) < today;
  }).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-10 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              Projects
            </Link>
            <div className="mt-3 flex items-center gap-4">
              <Avatar
                initials={initials(project.name)}
                className="h-14 w-14 text-base"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {project.name}
                  </h1>
                  <ProjectStatusBadge status={project.status} />
                  <ProjectPriorityBadge priority={project.priority} />
                </div>
                <Link
                  href={`/dashboard/clients/${project.clientId}`}
                  className="mt-1 inline-block text-sm text-muted transition-colors hover:text-primary-bright"
                >
                  {clientLabel}
                </Link>
              </div>
            </div>
          </div>
          <Button size="sm" variant="surface" onClick={() => setEditing(true)}>
            <Pencil aria-hidden className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
        <PanelHeader title="Overview" />
        {project.description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {project.description}
          </p>
        ) : (
          <p className="text-sm text-dim">No description yet.</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
          {overview.map((item) => (
            <div key={item.label}>
              <p className="text-xs text-faint">{item.label}</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
        <PanelHeader title="Team" description="Members assigned to this project" />
        <ProjectTeam
          projectId={project.id}
          assigned={assignedMembers}
          allMembers={allMembers}
          canManage={canManage}
        />
      </Panel>

      <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
        <PanelHeader
          title="Progress"
          description={
            totalTasks > 0
              ? `${completedTasks} of ${totalTasks} done · ${openTasks} open${overdueTasks > 0 ? ` · ${overdueTasks} overdue` : ""}`
              : "Track this project's work with tasks."
          }
          action={
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/tasks?project=${project.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-bright"
              >
                View all
                <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
              <Button size="sm" onClick={() => setNewTask(true)}>
                <Plus aria-hidden className="h-4 w-4" />
                New task
              </Button>
            </div>
          }
        />

        {totalTasks === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Add the first task to start tracking this project's progress."
            action={
              <Button onClick={() => setNewTask(true)}>
                <Plus aria-hidden className="h-4 w-4" />
                Add task
              </Button>
            }
          />
        ) : (
          <>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-bright"
                style={{ width: `${progress}%` }}
              />
            </div>

            <ul className="divide-y divide-line">
              {tasks.slice(0, 5).map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Link
                    href={`/dashboard/tasks/${task.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p
                      className={cn(
                        "truncate text-sm font-medium text-foreground transition-colors hover:text-primary-bright",
                        task.status === "completed" && "text-dim line-through",
                      )}
                    >
                      {task.title}
                    </p>
                    {task.dueDate ? (
                      <p className="text-xs text-dim">
                        Due {formatDateShort(task.dueDate)}
                      </p>
                    ) : null}
                  </Link>
                  <TaskStatusBadge status={task.status} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader
            title="Invoices"
            action={
              <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/invoices?project=${project.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-bright"
                >
                  View all
                  <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
                <Button size="sm" onClick={() => setNewInvoice(true)}>
                  <Plus aria-hidden className="h-4 w-4" />
                  New invoice
                </Button>
              </div>
            }
          />

          {invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No invoices yet"
              description="Invoices connected to this project will appear here."
            />
          ) : (
            <ul className="divide-y divide-line">
              {invoices.slice(0, 5).map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Link
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate text-sm font-medium tabular-nums text-foreground transition-colors hover:text-primary-bright">
                      {invoice.invoiceNumber}
                    </p>
                    {invoice.dueDate ? (
                      <p className="text-xs text-dim">
                        Due {formatDateShort(invoice.dueDate)}
                      </p>
                    ) : null}
                  </Link>
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {formatBudget(invoice.total)}
                  </span>
                  <InvoiceStatusBadge status={invoice.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
          <PanelHeader
            title="Financials"
            action={
              profitability ? (
                <Badge
                  variant={financialMeta[profitability.status].variant}
                  dot
                >
                  {financialMeta[profitability.status].label}
                </Badge>
              ) : null
            }
          />

          {profitability ? (
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Budget</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {profitability.budget
                    ? formatCurrencyPrecise(Number(profitability.budget))
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Invoiced</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatCurrencyPrecise(profitability.invoicedAmount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Paid</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatCurrencyPrecise(profitability.paidAmount)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Billable time</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatDuration(profitability.billableMinutes)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Billable value</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {formatCurrencyPrecise(profitability.billableValue)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Remaining budget</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {profitability.remainingBudget !== null
                    ? formatCurrencyPrecise(profitability.remainingBudget)
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Task completion</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {profitability.totalTasks > 0
                    ? `${Math.round(
                        (profitability.completedTasks / profitability.totalTasks) * 100,
                      )}%`
                    : "0%"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-dim">No financial data yet.</p>
          )}
        </Panel>
      </div>

      <Panel spotlight spotlightColor={SPOTLIGHT_NEUTRAL}>
        <PanelHeader title="Work history" description="What the team has done on this project" />
        <WorkHistory logs={workLogs} />
      </Panel>

      {editing ? (
        <ProjectDialog
          project={project}
          clients={clients}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      ) : null}

      {newTask ? (
        <TaskDialog
          task={null}
          projects={projects}
          preselectedProjectId={project.id}
          onClose={() => setNewTask(false)}
          onSaved={() => {
            setNewTask(false);
            router.refresh();
          }}
        />
      ) : null}

      {newInvoice ? (
        <InvoiceDialog
          invoice={null}
          clients={clients}
          projects={projects}
          preselectedClientId={project.clientId}
          preselectedProjectId={project.id}
          onClose={() => setNewInvoice(false)}
          onSaved={() => {
            setNewInvoice(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
