import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/roles";
import { getTimeEntry } from "@/lib/time/queries";
import { listProjects } from "@/lib/projects/queries";
import { listTasks } from "@/lib/tasks/queries";
import { TimeDetail } from "@/components/time/time-detail";

export const metadata: Metadata = {
  title: "Time entry",
  robots: { index: false, follow: false },
};

export default async function TimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const memberUserId = canManage(user) ? undefined : user.id;

  const entry = await getTimeEntry(user.workspaceId, id, memberUserId);
  if (!entry) notFound();

  const [projects, tasks] = await Promise.all([
    listProjects(user.workspaceId, { memberUserId }),
    listTasks(user.workspaceId, { memberUserId }),
  ]);

  return <TimeDetail entry={entry} projects={projects} tasks={tasks} />;
}
