import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getClientHealth } from "@/lib/clients/health";
import { ClientHealthView } from "@/components/clients/client-health-view";

export const metadata: Metadata = {
  title: "Client health",
  robots: { index: false, follow: false },
};

export default async function ClientHealthPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const clients = await getClientHealth(user.workspaceId);

  return <ClientHealthView clients={clients} />;
}
