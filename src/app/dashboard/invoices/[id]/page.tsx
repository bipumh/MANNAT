import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getInvoice } from "@/lib/invoices/queries";
import { listClients } from "@/lib/clients/queries";
import { listProjects } from "@/lib/projects/queries";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const invoice = await getInvoice(user.workspaceId, id);
  if (!invoice) notFound();

  const [clients, projects] = await Promise.all([
    listClients(user.workspaceId),
    listProjects(user.workspaceId),
  ]);

  return (
    <InvoiceDetail invoice={invoice} clients={clients} projects={projects} />
  );
}
