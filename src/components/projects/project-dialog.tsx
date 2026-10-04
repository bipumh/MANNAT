"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createProjectAction, updateProjectAction } from "@/lib/projects/actions";
import { budgetToInput } from "@/lib/format";
import type { Client, Project, ProjectPriority, ProjectStatus } from "@/types";

export function ProjectDialog({
  project,
  clients,
  onClose,
  onSaved,
}: {
  project: Project | null;
  clients: Client[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = project !== null;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const noClients = clients.length === 0;
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
      clientId: (formData.get("clientId") as string | null) ?? "",
      description: (formData.get("description") as string | null) ?? "",
      status: ((formData.get("status") as string | null) ?? "planned") as ProjectStatus,
      priority: ((formData.get("priority") as string | null) ?? "medium") as ProjectPriority,
      startDate: (formData.get("startDate") as string | null) ?? "",
      dueDate: (formData.get("dueDate") as string | null) ?? "",
      budget: (formData.get("budget") as string | null) ?? "",
    };

    const result = isEdit
      ? await updateProjectAction(project.id, input)
      : await createProjectAction(input);

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
        aria-label={isEdit ? "Edit project" : "New project"}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-lift"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              {isEdit ? "Edit project" : "New project"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isEdit
                ? "Update this project's details."
                : "Organize work for one of your clients."}
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
              Projects are connected to clients, so create your first client
              before starting a project.
            </p>
            <Button href="/dashboard/clients" className="mt-4">
              Go to clients
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Project name" htmlFor="project-name" required>
              <Input
                id="project-name"
                name="name"
                defaultValue={project?.name ?? ""}
                placeholder="e.g. Website redesign"
                required
              />
            </Field>

            <Field label="Client" htmlFor="project-client" required>
              <Select
                id="project-client"
                name="clientId"
                defaultValue={project?.clientId ?? ""}
                required
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

            <Field label="Description" htmlFor="project-description">
              <Textarea
                id="project-description"
                name="description"
                defaultValue={project?.description ?? ""}
                placeholder="What is this project about? (optional)"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status" htmlFor="project-status">
                <Select
                  id="project-status"
                  name="status"
                  defaultValue={project?.status ?? "planned"}
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In progress</option>
                  <option value="on_hold">On hold</option>
                  <option value="completed">Completed</option>
                </Select>
              </Field>
              <Field label="Priority" htmlFor="project-priority">
                <Select
                  id="project-priority"
                  name="priority"
                  defaultValue={project?.priority ?? "medium"}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start date" htmlFor="project-start">
                <Input
                  id="project-start"
                  name="startDate"
                  type="date"
                  defaultValue={project?.startDate ?? ""}
                />
              </Field>
              <Field label="Due date" htmlFor="project-due">
                <Input
                  id="project-due"
                  name="dueDate"
                  type="date"
                  defaultValue={project?.dueDate ?? ""}
                />
              </Field>
            </div>

            <Field label="Budget" htmlFor="project-budget">
              <Input
                id="project-budget"
                name="budget"
                type="number"
                min="0"
                step="0.01"
                defaultValue={budgetToInput(project?.budget ?? null)}
                placeholder="0.00"
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
                {isEdit ? "Save changes" : "Create project"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
