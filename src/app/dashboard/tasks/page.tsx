import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/roles";
import { listTasks } from "@/lib/tasks/queries";
import { listProjects } from "@/lib/projects/queries";
import { TasksView } from "@/components/tasks/tasks-view";
import type { TaskPriority, TaskStatus } from "@/types";

export const metadata: Metadata = {
  title: "Tasks",
  robots: { index: false, follow: false },
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status: TaskStatus | undefined =
    sp.status === "todo" ||
    sp.status === "in_progress" ||
    sp.status === "completed"
      ? sp.status
      : undefined;
  const priority: TaskPriority | undefined =
    sp.priority === "low" || sp.priority === "medium" || sp.priority === "high"
      ? sp.priority
      : undefined;
  const projectId = typeof sp.project === "string" ? sp.project : undefined;

  const memberUserId = canManage(user) ? undefined : user.id;

  const [tasks, projects] = await Promise.all([
    listTasks(user.workspaceId, { q, status, priority, projectId, memberUserId }),
    listProjects(user.workspaceId, { memberUserId }),
  ]);

  return (
    <TasksView
      tasks={tasks}
      projects={projects}
      query={q}
      status={status}
      priority={priority}
      projectId={projectId}
      canManage={canManage(user)}
    />
  );
}
