import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrencyPrecise } from "@/lib/format";
import type { ClientHealth, ClientHealthStatus } from "@/lib/clients/health";

const healthMeta: Record<
  ClientHealthStatus,
  { label: string; variant: "success" | "warning" | "danger" }
> = {
  healthy: { label: "Healthy", variant: "success" },
  watch: { label: "Watch", variant: "warning" },
  attention: { label: "Attention", variant: "danger" },
};

export function ClientHealthView({ clients }: { clients: ClientHealth[] }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Client health
        </h2>
        <p className="mt-1 text-sm text-muted">
          How each client is doing across projects, tasks and billing.
        </p>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add a client to start tracking their health."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-medium text-dim">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3 text-right">Active projects</th>
                  <th className="px-4 py-3 text-right">Open tasks</th>
                  <th className="px-4 py-3 text-right">Invoiced</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Overdue</th>
                  <th className="px-4 py-3">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {clients.map((client) => {
                  const meta = healthMeta[client.health];
                  return (
                    <tr key={client.clientId} className="transition-colors hover:bg-surface-2/50">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/clients/${client.clientId}`} className="block">
                          <p className="font-medium text-foreground transition-colors hover:text-primary-bright">
                            {client.clientName}
                          </p>
                          {client.clientCompany ? (
                            <p className="text-xs text-dim">{client.clientCompany}</p>
                          ) : null}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">
                        {client.activeProjects}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">
                        {client.openTasks}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">
                        {formatCurrencyPrecise(client.totalInvoiced)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">
                        {formatCurrencyPrecise(client.totalPaid)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">
                        {client.overdueInvoices}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={meta.variant} dot>
                          {meta.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {clients.map((client) => {
              const meta = healthMeta[client.health];
              return (
                <li key={client.clientId} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/dashboard/clients/${client.clientId}`} className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {client.clientName}
                      </p>
                      {client.clientCompany ? (
                        <p className="truncate text-xs text-dim">{client.clientCompany}</p>
                      ) : null}
                    </Link>
                    <Badge variant={meta.variant} dot>
                      {meta.label}
                    </Badge>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-dim">Active</dt>
                      <dd className="tabular-nums text-foreground">{client.activeProjects}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-dim">Open tasks</dt>
                      <dd className="tabular-nums text-foreground">{client.openTasks}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-dim">Invoiced</dt>
                      <dd className="tabular-nums text-foreground">
                        {formatCurrencyPrecise(client.totalInvoiced)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-dim">Paid</dt>
                      <dd className="tabular-nums text-foreground">
                        {formatCurrencyPrecise(client.totalPaid)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-dim">Overdue</dt>
                      <dd className="tabular-nums text-foreground">{client.overdueInvoices}</dd>
                    </div>
                  </dl>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
