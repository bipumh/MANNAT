import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/roles";
import { getTask } from "@/lib/tasks/queries";
import { listProjects } from "@/lib/projects/queries";
import { listWorkspaceMembers } from "@/lib/team/queries";
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

  const [projects, members] = await Promise.all([
    listProjects(user.workspaceId),
    listWorkspaceMembers(user.workspaceId),
  ]);

  return (
    <TaskDetail
      task={task}
      projects={projects}
      members={members}
      canManage={canManage(user)}
    />
  );
}
