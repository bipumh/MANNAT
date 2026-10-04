"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { createInvoiceFromTimeAction } from "@/lib/time/actions";
import { formatCurrencyPrecise, formatDuration } from "@/lib/format";
import type { UnbilledProjectSummary } from "@/lib/time/queries";

export function TimeInvoiceDialog({
  summaries,
  onClose,
  onSaved,
}: {
  summaries: UnbilledProjectSummary[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [projectId, setProjectId] = useState(summaries[0]?.projectId ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = summaries.find((s) => s.projectId === projectId);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

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
    const result = await createInvoiceFromTimeAction({ projectId });
    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      onSaved();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Create invoice from time"
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-lift"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Invoice from time
            </h2>
            <p className="mt-1 text-sm text-muted">
              Convert unbilled, billable time into an invoice.
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

        {summaries.length === 0 ? (
          <div className="mt-6 rounded-lg border border-line bg-surface-2 px-4 py-5 text-center">
            <p className="text-sm font-medium text-foreground">
              No unbilled time
            </p>
            <p className="mt-1 text-sm text-muted">
              Log billable time with an hourly rate, then come back to convert
              it into an invoice.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Project" htmlFor="ti-project" required>
              <Select
                id="ti-project"
                name="projectId"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                required
              >
                {summaries.map((summary) => (
                  <option key={summary.projectId} value={summary.projectId}>
                    {summary.clientName
                      ? `${summary.projectName} — ${summary.clientName}`
                      : summary.projectName}
                  </option>
                ))}
              </Select>
            </Field>

            {selected ? (
              <div className="space-y-2 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Entries</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {selected.entryCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Billable time</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatDuration(selected.totalMinutes)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-2">
                  <span className="text-muted">Invoice total</span>
                  <span className="font-display text-base font-semibold text-foreground">
                    {formatCurrencyPrecise(selected.totalValue)}
                  </span>
                </div>
              </div>
            ) : null}

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
                Create invoice
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
