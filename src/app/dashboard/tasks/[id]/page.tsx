import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getTask } from "@/lib/tasks/queries";
import { listProjects } from "@/lib/projects/queries";
import { TaskDetail } from "@/components/tasks/task-detail";

export const metadata: Metadata = {
  title: "Task",
  robots: { index: false, follow: false },
};

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const task = await getTask(user.workspaceId, id);
  if (!task) notFound();

  const projects = await listProjects(user.workspaceId);

  return <TaskDetail task={task} projects={projects} />;
}
