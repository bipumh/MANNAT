import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
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
  const entry = await getTimeEntry(user.workspaceId, id);
  if (!entry) notFound();

  const [projects, tasks] = await Promise.all([
    listProjects(user.workspaceId),
    listTasks(user.workspaceId),
  ]);

  return <TimeDetail entry={entry} projects={projects} tasks={tasks} />;
}
