import type {
  ClientStatus,
  DemoInvoiceStatus,
  DemoProjectStatus,
  InvoiceStatus,
  ProjectPriority,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  WorkspaceRole,
} from "@/types";
import { Badge } from "@/components/ui/badge";

type BadgeVariant = "neutral" | "success" | "warning" | "danger";

const demoProjectStatus: Record<DemoProjectStatus, { label: string; variant: BadgeVariant }> = {
  "on-track": { label: "On track", variant: "success" },
  "at-risk": { label: "At risk", variant: "warning" },
  completed: { label: "Completed", variant: "neutral" },
  planned: { label: "Planned", variant: "neutral" },
};

const projectStatus: Record<ProjectStatus, { label: string; variant: BadgeVariant }> = {
  planned: { label: "Planned", variant: "neutral" },
  in_progress: { label: "In progress", variant: "success" },
  on_hold: { label: "On hold", variant: "warning" },
  completed: { label: "Completed", variant: "neutral" },
};

const projectPriority: Record<ProjectPriority, { label: string; variant: BadgeVariant }> = {
  low: { label: "Low", variant: "neutral" },
  medium: { label: "Medium", variant: "warning" },
  high: { label: "High", variant: "danger" },
};

const demoInvoiceStatus: Record<DemoInvoiceStatus, { label: string; variant: BadgeVariant }> = {
  paid: { label: "Paid", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  overdue: { label: "Overdue", variant: "danger" },
  draft: { label: "Draft", variant: "neutral" },
};

const invoiceStatus: Record<InvoiceStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: "Draft", variant: "neutral" },
  sent: { label: "Sent", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  overdue: { label: "Overdue", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

const taskPriority: Record<TaskPriority, { label: string; variant: BadgeVariant }> = {
  high: { label: "High", variant: "danger" },
  medium: { label: "Medium", variant: "warning" },
  low: { label: "Low", variant: "neutral" },
};

const taskStatus: Record<TaskStatus, { label: string; variant: BadgeVariant }> = {
  todo: { label: "To do", variant: "neutral" },
  in_progress: { label: "In progress", variant: "success" },
  completed: { label: "Completed", variant: "neutral" },
};

const clientStatus: Record<ClientStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "neutral" },
};

const workspaceRole: Record<WorkspaceRole, { label: string; variant: BadgeVariant }> = {
  owner: { label: "Owner", variant: "success" },
  admin: { label: "Admin", variant: "warning" },
  member: { label: "Member", variant: "neutral" },
};

export function DemoProjectStatusBadge({ status }: { status: DemoProjectStatus }) {
  const meta = demoProjectStatus[status];
  return (
    <Badge variant={meta.variant} dot>
      {meta.label}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = projectStatus[status];
  return (
    <Badge variant={meta.variant} dot>
      {meta.label}
    </Badge>
  );
}

export function ProjectPriorityBadge({ priority }: { priority: ProjectPriority }) {
  const meta = projectPriority[priority];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function DemoInvoiceStatusBadge({ status }: { status: DemoInvoiceStatus }) {
  const meta = demoInvoiceStatus[status];
  return (
    <Badge variant={meta.variant} dot>
      {meta.label}
    </Badge>
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const meta = invoiceStatus[status];
  return (
    <Badge variant={meta.variant} dot>
      {meta.label}
    </Badge>
  );
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const meta = taskPriority[priority];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const meta = taskStatus[status];
  return (
    <Badge variant={meta.variant} dot>
      {meta.label}
    </Badge>
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const meta = clientStatus[status];
  return (
    <Badge variant={meta.variant} dot>
      {meta.label}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: WorkspaceRole }) {
  const meta = workspaceRole[role];
  return (
    <Badge variant={meta.variant} dot>
      {meta.label}
    </Badge>
  );
}
