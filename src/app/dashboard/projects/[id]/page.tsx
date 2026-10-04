import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/roles";
import { getProject, listProjects } from "@/lib/projects/queries";
import { getProjectProfitability } from "@/lib/projects/profitability";
import { listProjectMembers } from "@/lib/projects/members";
import { listClients } from "@/lib/clients/queries";
import { listTasks } from "@/lib/tasks/queries";
import { listInvoices } from "@/lib/invoices/queries";
import { listWorkspaceMembers } from "@/lib/team/queries";
import { listWorkLogs } from "@/lib/work-log/queries";
import { ProjectDetail } from "@/components/projects/project-detail";

export const metadata: Metadata = {
  title: "Project",
  robots: { index: false, follow: false },
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const manager = canManage(user);
  const memberUserId = manager ? undefined : user.id;

  const project = await getProject(user.workspaceId, id, memberUserId);
  if (!project) notFound();

  const [
    clients,
    projects,
    tasks,
    invoices,
    profitability,
    assignedMembers,
    allMembers,
    workLogs,
  ] = await Promise.all([
    listClients(user.workspaceId, { memberUserId }),
    listProjects(user.workspaceId, { memberUserId }),
    listTasks(user.workspaceId, { projectId: id, memberUserId }),
    manager ? listInvoices(user.workspaceId, { projectId: id }) : Promise.resolve([]),
    manager ? getProjectProfitability(user.workspaceId, id) : Promise.resolve(null),
    listProjectMembers(user.workspaceId, id),
    manager ? listWorkspaceMembers(user.workspaceId) : Promise.resolve([]),
    listWorkLogs(user.workspaceId, { projectId: id, userId: memberUserId }),
  ]);

  return (
    <ProjectDetail
      project={project}
      clients={clients}
      projects={projects}
      tasks={tasks}
      invoices={invoices}
      profitability={profitability}
      assignedMembers={assignedMembers}
      allMembers={allMembers}
      canManage={manager}
      workLogs={workLogs}
    />
  );
}
