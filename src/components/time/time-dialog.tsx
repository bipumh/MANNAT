"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  createTimeEntryAction,
  updateTimeEntryAction,
} from "@/lib/time/actions";
import { formatCurrencyPrecise } from "@/lib/format";
import type { Project, Task, TimeEntry } from "@/types";

function localToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function TimeDialog({
  entry,
  projects,
  tasks,
  preselectedProjectId,
  preselectedTaskId,
  onClose,
  onSaved,
}: {
  entry: TimeEntry | null;
  projects: Project[];
  tasks: Task[];
  preselectedProjectId?: string;
  preselectedTaskId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = entry !== null;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [projectId, setProjectId] = useState(
    preselectedProjectId ?? entry?.projectId ?? "",
  );
  const [taskId, setTaskId] = useState(
    preselectedTaskId ?? entry?.taskId ?? "",
  );
  const [hours, setHours] = useState(
    entry ? String(Math.floor(entry.durationMinutes / 60)) : "0",
  );
  const [minutes, setMinutes] = useState(
    entry ? String(entry.durationMinutes % 60) : "0",
  );
  const [rate, setRate] = useState(entry?.hourlyRate ?? "");
  const [billable, setBillable] = useState(entry ? entry.billable : true);

  const noProjects = projects.length === 0;
  const projectTasks = tasks.filter((t) => t.projectId === projectId);

  const durationMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
  const amount =
    billable && rate && Number(rate) > 0
      ? (durationMinutes / 60) * Number(rate)
      : null;

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
      projectId,
      taskId,
      description: (formData.get("description") as string | null) ?? "",
      date: (formData.get("date") as string | null) ?? "",
      durationMinutes,
      billable,
      hourlyRate: rate,
    };

    const result = isEdit
      ? await updateTimeEntryAction(entry.id, input)
      : await createTimeEntryAction(input);

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
        aria-label={isEdit ? "Edit time entry" : "Log time"}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-lift"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              {isEdit ? "Edit time entry" : "Log time"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isEdit
                ? "Update this time entry's details."
                : "Record the time you spent on a project or task."}
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

        {noProjects ? (
          <div className="mt-6 rounded-lg border border-line bg-surface-2 px-4 py-5 text-center">
            <p className="text-sm font-medium text-foreground">
              Create a project first
            </p>
            <p className="mt-1 text-sm text-muted">
              Time entries must belong to a project, so create a project before
              logging time.
            </p>
            <Button href="/dashboard/projects" className="mt-4">
              Go to projects
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {preselectedProjectId ? (
              <input
                type="hidden"
                name="projectId"
                value={preselectedProjectId}
              />
            ) : null}
            <Field label="Project" htmlFor="time-project" required>
              <Select
                id="time-project"
                name="projectId"
                value={projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  setTaskId("");
                }}
                required
                disabled={Boolean(preselectedProjectId)}
              >
                <option value="" disabled>
                  Select a project…
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>

            {preselectedTaskId ? (
              <input type="hidden" name="taskId" value={preselectedTaskId} />
            ) : null}
            <Field label="Task" htmlFor="time-task">
              <Select
                id="time-task"
                name="taskId"
                value={taskId}
                onChange={(event) => setTaskId(event.target.value)}
                disabled={Boolean(preselectedTaskId) || !projectId}
              >
                <option value="">No task</option>
                {projectTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Description" htmlFor="time-description">
              <Textarea
                id="time-description"
                name="description"
                defaultValue={entry?.description ?? ""}
                placeholder="What did you work on? (optional)"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date" htmlFor="time-date" required>
                <Input
                  id="time-date"
                  name="date"
                  type="date"
                  defaultValue={entry?.date ?? localToday()}
                  required
                />
              </Field>
              <Field label="Duration" htmlFor="time-hours" required>
                <div className="flex items-center gap-2">
                  <Input
                    id="time-hours"
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
                    id="time-minutes"
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
              <Field label="Hourly rate" htmlFor="time-rate">
                <Input
                  id="time-rate"
                  name="hourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                  placeholder="0.00"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-4 py-3">
              <span className="text-sm text-muted">
                {billable ? "Billable amount" : "Non-billable"}
              </span>
              <span className="font-display text-lg font-semibold text-foreground">
                {amount !== null ? formatCurrencyPrecise(amount) : "—"}
              </span>
            </div>

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
                {isEdit ? "Save changes" : "Log time"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
