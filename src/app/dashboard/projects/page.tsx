import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/roles";
import { listProjects } from "@/lib/projects/queries";
import { listClients } from "@/lib/clients/queries";
import { ProjectsView } from "@/components/projects/projects-view";
import type { ProjectPriority, ProjectStatus } from "@/types";

export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false, follow: false },
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status: ProjectStatus | undefined =
    sp.status === "planned" ||
    sp.status === "in_progress" ||
    sp.status === "on_hold" ||
    sp.status === "completed"
      ? sp.status
      : undefined;
  const priority: ProjectPriority | undefined =
    sp.priority === "low" || sp.priority === "medium" || sp.priority === "high"
      ? sp.priority
      : undefined;

  const memberUserId = canManage(user) ? undefined : user.id;

  const [projects, clients] = await Promise.all([
    listProjects(user.workspaceId, { q, status, priority, memberUserId }),
    listClients(user.workspaceId, { memberUserId }),
  ]);

  return (
    <ProjectsView
      projects={projects}
      clients={clients}
      query={q}
      status={status}
      priority={priority}
      canManage={canManage(user)}
    />
  );
}
