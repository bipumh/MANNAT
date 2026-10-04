"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createClientAction, updateClientAction } from "@/lib/clients/actions";
import type { Client, ClientStatus } from "@/types";

export function ClientDialog({
  client,
  onClose,
  onSaved,
}: {
  client: Client | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = client !== null;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
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

    const formData = new FormData(event.currentTarget);
    const input = {
      name: (formData.get("name") as string | null) ?? "",
      company: (formData.get("company") as string | null) ?? "",
      email: (formData.get("email") as string | null) ?? "",
      phone: (formData.get("phone") as string | null) ?? "",
      website: (formData.get("website") as string | null) ?? "",
      notes: (formData.get("notes") as string | null) ?? "",
      status: ((formData.get("status") as string | null) ?? "active") as ClientStatus,
    };

    const result = isEdit
      ? await updateClientAction(client.id, input)
      : await createClientAction(input);

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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? "Edit client" : "New client"}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-lift"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              {isEdit ? "Edit client" : "New client"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isEdit
                ? "Update this client's details."
                : "Add a client to your workspace."}
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Name" htmlFor="client-name" required>
            <Input
              id="client-name"
              name="name"
              defaultValue={client?.name ?? ""}
              placeholder="Client or contact name"
              required
            />
          </Field>

          <Field label="Company" htmlFor="client-company">
            <Input
              id="client-company"
              name="company"
              defaultValue={client?.company ?? ""}
              placeholder="Company (optional)"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="client-email">
              <Input
                id="client-email"
                name="email"
                type="email"
                defaultValue={client?.email ?? ""}
                placeholder="name@company.com"
              />
            </Field>
            <Field label="Phone" htmlFor="client-phone">
              <Input
                id="client-phone"
                name="phone"
                defaultValue={client?.phone ?? ""}
                placeholder="+1 (555) 000-0000"
              />
            </Field>
          </div>

          <Field label="Website" htmlFor="client-website">
            <Input
              id="client-website"
              name="website"
              defaultValue={client?.website ?? ""}
              placeholder="https://company.com"
            />
          </Field>

          <Field label="Status" htmlFor="client-status">
            <Select
              id="client-status"
              name="status"
              defaultValue={client?.status ?? "active"}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>

          <Field label="Notes" htmlFor="client-notes">
            <Textarea
              id="client-notes"
              name="notes"
              defaultValue={client?.notes ?? ""}
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
              {isEdit ? "Save changes" : "Add client"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
