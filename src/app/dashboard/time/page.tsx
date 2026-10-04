import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/roles";
import { getUnbilledTimeSummary, listTimeEntries } from "@/lib/time/queries";
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

  const memberUserId = canManage(user) ? undefined : user.id;

  const [entries, projects, tasks, unbilled] = await Promise.all([
    listTimeEntries(user.workspaceId, {
      q,
      projectId,
      taskId,
      billable,
      userId: memberUserId,
    }),
    listProjects(user.workspaceId, { memberUserId }),
    listTasks(user.workspaceId, { memberUserId }),
    canManage(user) ? getUnbilledTimeSummary(user.workspaceId) : Promise.resolve([]),
  ]);

  return (
    <TimeView
      entries={entries}
      projects={projects}
      tasks={tasks}
      unbilled={unbilled}
      query={q}
      projectId={projectId}
      taskId={taskId}
      billable={billable}
      canManage={canManage(user)}
    />
  );
}
