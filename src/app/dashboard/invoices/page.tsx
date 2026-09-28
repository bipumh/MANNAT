import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listInvoices } from "@/lib/invoices/queries";
import { listClients } from "@/lib/clients/queries";
import { listProjects } from "@/lib/projects/queries";
import { InvoicesView } from "@/components/invoices/invoices-view";
import type { InvoiceStatus } from "@/types";

export const metadata: Metadata = {
  title: "Invoices",
  robots: { index: false, follow: false },
};

const invoiceStatuses: InvoiceStatus[] = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status: InvoiceStatus | undefined = invoiceStatuses.includes(
    sp.status as InvoiceStatus,
  )
    ? (sp.status as InvoiceStatus)
    : undefined;
  const clientId = typeof sp.client === "string" ? sp.client : undefined;
  const projectId = typeof sp.project === "string" ? sp.project : undefined;

  const [invoices, clients, projects] = await Promise.all([
    listInvoices(user.workspaceId, { q, status, clientId, projectId }),
    listClients(user.workspaceId),
    listProjects(user.workspaceId),
  ]);

  return (
    <InvoicesView
      invoices={invoices}
      clients={clients}
      projects={projects}
      query={q}
      status={status}
      clientId={clientId}
      projectId={projectId}
    />
  );
}
