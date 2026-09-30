"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createWorkLogAction } from "@/lib/work-log/actions";
import { formatCurrencyPrecise } from "@/lib/format";
import type { Client, Project, Task } from "@/types";

function localToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function RecordWorkDialog({
  clients,
  projects,
  tasks,
  preselectedClientId,
  preselectedProjectId,
  onClose,
  onSaved,
}: {
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  preselectedClientId?: string;
  preselectedProjectId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [clientId, setClientId] = useState(preselectedClientId ?? "");
  const [projectId, setProjectId] = useState(preselectedProjectId ?? "");
  const [taskId, setTaskId] = useState("");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");
  const [rate, setRate] = useState("");
  const [billable, setBillable] = useState(true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const projectOptions = projects.filter((p) =>
    clientId ? p.clientId === clientId : true,
  );
  const taskOptions = tasks.filter((t) =>
    projectId ? t.projectId === projectId : true,
  );

  const durationMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
  const amount =
    billable && rate && Number(rate) > 0
      ? (durationMinutes / 60) * Number(rate)
      : null;

  function onClientChange(value: string) {
    setClientId(value);
    if (projectId && !projects.some((p) => p.id === projectId && p.clientId === value)) {
      setProjectId("");
      setTaskId("");
    }
  }

  function onProjectChange(value: string) {
    setProjectId(value);
    setTaskId("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const input = {
      clientId,
      projectId,
      taskId,
      date: (formData.get("date") as string | null) ?? "",
      description: (formData.get("description") as string | null) ?? "",
      durationMinutes,
      billable,
      rate,
      notes: (formData.get("notes") as string | null) ?? "",
    };

    const result = await createWorkLogAction(input);

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
        role="dialog"
        aria-modal="true"
        aria-label="Record work"
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-lift"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Record work
            </h2>
            <p className="mt-1 text-sm text-muted">
              Note what you did for a client or project.
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client" htmlFor="work-client" required>
              <Select
                id="work-client"
                name="clientId"
                value={clientId}
                onChange={(event) => onClientChange(event.target.value)}
                required
              >
                <option value="" disabled>
                  Select a client…
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Project" htmlFor="work-project" required>
              <Select
                id="work-project"
                name="projectId"
                value={projectId}
                onChange={(event) => onProjectChange(event.target.value)}
                required
                disabled={!clientId}
              >
                <option value="" disabled>
                  Select a project…
                </option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Task (optional)" htmlFor="work-task">
            <Select
              id="work-task"
              name="taskId"
              value={taskId}
              onChange={(event) => setTaskId(event.target.value)}
              disabled={!projectId}
            >
              <option value="">No task</option>
              {taskOptions.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Work description" htmlFor="work-description" required>
            <Textarea
              id="work-description"
              name="description"
              placeholder="What did you do?"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" htmlFor="work-date" required>
              <Input
                id="work-date"
                name="date"
                type="date"
                defaultValue={localToday()}
                required
              />
            </Field>
            <Field label="Duration" htmlFor="work-hours" required>
              <div className="flex items-center gap-2">
                <Input
                  id="work-hours"
                  name="hours"
                  type="number"
                  min="0"
                  value={hours}
                  onChange={(event) => setHours(event.target.value)}
                  aria-label="Hours"
                  placeholder="0"
                  required
                />
                <span className="text-sm text-dim">h</span>
                <Input
                  id="work-minutes"
                  name="minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(event) => setMinutes(event.target.value)}
                  aria-label="Minutes"
                  placeholder="0"
                />
                <span className="text-sm text-dim">m</span>
              </div>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                name="billable"
                checked={billable}
                onChange={(event) => setBillable(event.target.checked)}
                className="h-4 w-4 rounded border-line-strong accent-primary"
              />
              Billable
            </label>
            <Field label="Hourly rate" htmlFor="work-rate">
              <Input
                id="work-rate"
                name="rate"
                type="number"
                min="0"
                step="0.01"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                placeholder="0.00"
              />
            </Field>
          </div>

          <Field label="Notes" htmlFor="work-notes">
            <Textarea
              id="work-notes"
              name="notes"
              placeholder="Any additional context (optional)"
            />
          </Field>

          {billable && amount !== null ? (
            <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-4 py-3">
              <span className="text-sm text-muted">Billable value</span>
              <span className="font-display text-lg font-semibold text-foreground">
                {formatCurrencyPrecise(amount)}
              </span>
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
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
              Save work
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
