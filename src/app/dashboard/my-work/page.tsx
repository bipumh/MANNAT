import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/roles";
import { getMyWork } from "@/lib/my-work/queries";
import { listClients } from "@/lib/clients/queries";
import { listProjects } from "@/lib/projects/queries";
import { listTasks } from "@/lib/tasks/queries";
import { MyWorkView } from "@/components/my-work/my-work-view";

export const metadata: Metadata = {
  title: "My Work",
  robots: { index: false, follow: false },
};

export default async function MyWorkPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const memberUserId = canManage(user) ? undefined : user.id;

  const [data, clients, allProjects, allTasks] = await Promise.all([
    getMyWork(user.workspaceId, user.id),
    listClients(user.workspaceId, { memberUserId }),
    listProjects(user.workspaceId, { memberUserId }),
    listTasks(user.workspaceId, { memberUserId }),
  ]);

  // Regular members may only record work against projects they're assigned to;
  // owners/admins may record work on any project.
  const dialogProjects = canManage(user) ? allProjects : data.projects;

  return (
    <MyWorkView
      data={data}
      clients={clients}
      projects={dialogProjects}
      tasks={allTasks}
    />
  );
}
