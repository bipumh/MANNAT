import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/roles";
import { listClients } from "@/lib/clients/queries";
import { ClientsView } from "@/components/clients/clients-view";
import type { ClientStatus } from "@/types";

export const metadata: Metadata = {
  title: "Clients",
  robots: { index: false, follow: false },
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status: ClientStatus | undefined =
    sp.status === "active" || sp.status === "inactive" ? sp.status : undefined;

  const memberUserId = canManage(user) ? undefined : user.id;
  const clients = await listClients(user.workspaceId, { q, status, memberUserId });

  return (
    <ClientsView
      clients={clients}
      query={q}
      status={status}
      canManage={canManage(user)}
    />
  );
}
