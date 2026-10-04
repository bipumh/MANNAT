import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/roles";
import { getClient, listClients } from "@/lib/clients/queries";
import { listProjects } from "@/lib/projects/queries";
import { listInvoices } from "@/lib/invoices/queries";
import { listWorkLogs } from "@/lib/work-log/queries";
import { ClientDetail } from "@/components/clients/client-detail";

export const metadata: Metadata = {
  title: "Client",
  robots: { index: false, follow: false },
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const manager = canManage(user);
  const memberUserId = manager ? undefined : user.id;

  const client = await getClient(user.workspaceId, id, memberUserId);
  if (!client) notFound();

  const [clients, projects, invoices, workLogs] = await Promise.all([
    listClients(user.workspaceId, { memberUserId }),
    listProjects(user.workspaceId, { memberUserId }),
    manager ? listInvoices(user.workspaceId, { clientId: id }) : Promise.resolve([]),
    listWorkLogs(user.workspaceId, { clientId: id, userId: memberUserId }),
  ]);

  return (
    <ClientDetail
      client={client}
      invoices={invoices}
      clients={clients}
      projects={projects}
      workLogs={workLogs}
      canManage={manager}
    />
  );
}
