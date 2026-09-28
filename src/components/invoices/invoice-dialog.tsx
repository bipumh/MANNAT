"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createInvoiceAction, updateInvoiceAction } from "@/lib/invoices/actions";
import { budgetToInput } from "@/lib/format";
import type { Client, Invoice, InvoiceStatus, Project } from "@/types";

function localToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function InvoiceDialog({
  invoice,
  clients,
  projects,
  preselectedClientId,
  preselectedProjectId,
  onClose,
  onSaved,
}: {
  invoice: Invoice | null;
  clients: Client[];
  projects: Project[];
  preselectedClientId?: string;
  preselectedProjectId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = invoice !== null;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [clientId, setClientId] = useState(
    preselectedClientId ?? invoice?.clientId ?? "",
  );
  const [subtotal, setSubtotal] = useState(
    invoice ? budgetToInput(invoice.subtotal) : "",
  );
  const [tax, setTax] = useState(invoice ? budgetToInput(invoice.tax) : "0");

  const noClients = clients.length === 0;
  const clientProjects = projects.filter((p) => p.clientId === clientId);
  const total = (Number(subtotal) || 0) + (Number(tax) || 0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const input = {
      clientId: (formData.get("clientId") as string | null) ?? "",
      projectId: (formData.get("projectId") as string | null) ?? "",
      issueDate: (formData.get("issueDate") as string | null) ?? "",
      dueDate: (formData.get("dueDate") as string | null) ?? "",
      subtotal: (formData.get("subtotal") as string | null) ?? "",
      tax: (formData.get("tax") as string | null) ?? "",
      notes: (formData.get("notes") as string | null) ?? "",
      status: ((formData.get("status") as string | null) ?? "draft") as InvoiceStatus,
    };

    const result = isEdit
      ? await updateInvoiceAction(invoice.id, input)
      : await createInvoiceAction(input);

    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      onSaved();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit invoice" : "New invoice"}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-lift"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              {isEdit ? "Edit invoice" : "New invoice"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isEdit
                ? "Update this invoice's details."
                : "Create an invoice for one of your clients."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        {noClients ? (
          <div className="mt-6 rounded-lg border border-line bg-surface-2 px-4 py-5 text-center">
            <p className="text-sm font-medium text-foreground">
              Create a client first
            </p>
            <p className="mt-1 text-sm text-muted">
              Invoices must belong to a client, so create your first client
              before creating an invoice.
            </p>
            <Button href="/dashboard/clients" className="mt-4">
              Go to clients
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {preselectedClientId ? (
              <input type="hidden" name="clientId" value={preselectedClientId} />
            ) : null}
            <Field label="Client" htmlFor="invoice-client" required>
              <Select
                id="invoice-client"
                name="clientId"
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                required
                disabled={Boolean(preselectedClientId)}
              >
                <option value="" disabled>
                  Select a client…
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company
                      ? `${client.name} — ${client.company}`
                      : client.name}
                  </option>
                ))}
              </Select>
            </Field>

            {preselectedProjectId ? (
              <input
                type="hidden"
                name="projectId"
                value={preselectedProjectId}
              />
            ) : null}
            <Field label="Project" htmlFor="invoice-project">
              <Select
                id="invoice-project"
                name="projectId"
                defaultValue={preselectedProjectId ?? invoice?.projectId ?? ""}
                disabled={Boolean(preselectedProjectId)}
              >
                <option value="">No project</option>
                {clientProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Issue date" htmlFor="invoice-issue">
                <Input
                  id="invoice-issue"
                  name="issueDate"
                  type="date"
                  defaultValue={invoice?.issueDate ?? localToday()}
                />
              </Field>
              <Field label="Due date" htmlFor="invoice-due">
                <Input
                  id="invoice-due"
                  name="dueDate"
                  type="date"
                  defaultValue={invoice?.dueDate ?? ""}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Subtotal" htmlFor="invoice-subtotal" required>
                <Input
                  id="invoice-subtotal"
                  name="subtotal"
                  type="number"
                  min="0"
                  step="0.01"
                  value={subtotal}
                  onChange={(event) => setSubtotal(event.target.value)}
                  placeholder="0.00"
                  required
                />
              </Field>
              <Field label="Tax" htmlFor="invoice-tax">
                <Input
                  id="invoice-tax"
                  name="tax"
                  type="number"
                  min="0"
                  step="0.01"
                  value={tax}
                  onChange={(event) => setTax(event.target.value)}
                  placeholder="0.00"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-4 py-3">
              <span className="text-sm text-muted">Total</span>
              <span className="font-display text-lg font-semibold text-foreground">
                {`$${total.toFixed(2)}`}
              </span>
            </div>

            <Field label="Status" htmlFor="invoice-status">
              <Select
                id="invoice-status"
                name="status"
                defaultValue={invoice?.status ?? "draft"}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </Field>

            <Field label="Notes" htmlFor="invoice-notes">
              <Textarea
                id="invoice-notes"
                name="notes"
                defaultValue={invoice?.notes ?? ""}
                placeholder="Add notes (optional)"
              />
            </Field>

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                ) : null}
                {isEdit ? "Save changes" : "Create invoice"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
