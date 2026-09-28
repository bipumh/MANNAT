export type WorkspaceRole = "owner" | "admin" | "member";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  initials: string;
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
};

export type DemoProjectStatus = "on-track" | "at-risk" | "completed" | "planned";

export type DemoInvoiceStatus = "paid" | "pending" | "overdue" | "draft";

export type TaskPriority = "low" | "medium" | "high";

export type ClientStatus = "active" | "inactive";

export type Client = {
  id: string;
  workspaceId: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  status: ClientStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

// Legacy demo project data (dashboard/landing previews).
export type DemoProject = {
  id: string;
  name: string;
  client: string;
  status: DemoProjectStatus;
  progress: number;
  due: string;
  team: string[];
};

// Persistent project (Neon PostgreSQL).
export type ProjectStatus = "planned" | "in_progress" | "on_hold" | "completed";

export type ProjectPriority = "low" | "medium" | "high";

export type Project = {
  id: string;
  workspaceId: string;
  clientId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string | null;
  dueDate: string | null;
  budget: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  clientName: string | null;
  clientCompany: string | null;
};

// Legacy demo invoice data (dashboard overview).
export type DemoInvoice = {
  id: string;
  number: string;
  client: string;
  amount: number;
  status: DemoInvoiceStatus;
  issued: string;
};

// Persistent invoice (Neon PostgreSQL).
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export type Invoice = {
  id: string;
  workspaceId: string;
  clientId: string;
  projectId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  subtotal: string;
  tax: string;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  clientName: string | null;
  clientCompany: string | null;
  clientEmail: string | null;
  projectName: string | null;
};

// Legacy demo task data (dashboard overview).
export type DemoTask = {
  id: string;
  title: string;
  project: string;
  priority: TaskPriority;
  due: string;
  done: boolean;
};

// Persistent task (Neon PostgreSQL).
export type TaskStatus = "todo" | "in_progress" | "completed";

export type Task = {
  id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  projectName: string | null;
  clientId: string | null;
  clientName: string | null;
  clientCompany: string | null;
};

// Persistent time entry (Neon PostgreSQL).
export type TimeEntry = {
  id: string;
  workspaceId: string;
  projectId: string;
  taskId: string | null;
  description: string | null;
  date: string;
  durationMinutes: number;
  billable: boolean;
  hourlyRate: string | null;
  createdAt: string;
  updatedAt: string;
  projectName: string | null;
  taskTitle: string | null;
  clientId: string | null;
  clientName: string | null;
  clientCompany: string | null;
};

// Workspace membership (Team & Members module).
export type TeamRole = "admin" | "member";

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  fullName: string;
  email: string | null;
};

export type TeamInvitation = {
  id: string;
  workspaceId: string;
  email: string;
  role: TeamRole;
  token: string;
  invitedBy: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  inviterName: string | null;
  workspaceName: string | null;
  expired: boolean;
};

// Activity & notifications (Activity module).
export type ActivityEntityType =
  | "client"
  | "project"
  | "task"
  | "invoice"
  | "time"
  | "member";

export type ActivityEvent = {
  id: string;
  workspaceId: string;
  actorUserId: string | null;
  eventType: string;
  entityType: string;
  entityId: string | null;
  title: string;
  description: string | null;
  createdAt: string;
  actorName: string | null;
};

export type Notification = {
  id: string;
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  message: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
};

// Notification preferences (Settings module).
export type NotificationPreferences = {
  memberUpdates: boolean;
  invoiceUpdates: boolean;
};

export type Activity = {
  id: string;
  actor: string;
  actorInitials: string;
  action: string;
  target: string;
  time: string;
};

export type RevenuePoint = {
  month: string;
  revenue: number;
  expenses: number;
  year?: number;
};
