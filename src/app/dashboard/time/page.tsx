import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listTimeEntries } from "@/lib/time/queries";
import { listProjects } from "@/lib/projects/queries";
import { listTasks } from "@/lib/tasks/queries";
import { TimeView } from "@/components/time/time-view";

export const metadata: Metadata = {
  title: "Time",
  robots: { index: false, follow: false },
};

export default async function TimePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const projectId = typeof sp.project === "string" ? sp.project : undefined;
  const taskId = typeof sp.task === "string" ? sp.task : undefined;
  const billable =
    sp.billable === "true" ? true : sp.billable === "false" ? false : undefined;

  const [entries, projects, tasks] = await Promise.all([
    listTimeEntries(user.workspaceId, { q, projectId, taskId, billable }),
    listProjects(user.workspaceId),
    listTasks(user.workspaceId),
  ]);

  return (
    <TimeView
      entries={entries}
      projects={projects}
      tasks={tasks}
      query={q}
      projectId={projectId}
      taskId={taskId}
      billable={billable}
    />
  );
}
