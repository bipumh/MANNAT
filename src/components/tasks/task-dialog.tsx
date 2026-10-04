"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { createTaskAction, updateTaskAction } from "@/lib/tasks/actions";
import type { Project, Task, TaskPriority, TaskStatus } from "@/types";

export function TaskDialog({
  task,
  projects,
  preselectedProjectId,
  onClose,
  onSaved,
}: {
  task: Task | null;
  projects: Project[];
  preselectedProjectId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = task !== null;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const noProjects = projects.length === 0;
  const preselectedName = projects.find((p) => p.id === preselectedProjectId)?.name;
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
      title: (formData.get("title") as string | null) ?? "",
      description: (formData.get("description") as string | null) ?? "",
      projectId: (formData.get("projectId") as string | null) ?? "",
      status: ((formData.get("status") as string | null) ?? "todo") as TaskStatus,
      priority: ((formData.get("priority") as string | null) ?? "medium") as TaskPriority,
      dueDate: (formData.get("dueDate") as string | null) ?? "",
    };

    const result = isEdit
      ? await updateTaskAction(task.id, input)
      : await createTaskAction(input);

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
        aria-label={isEdit ? "Edit task" : "New task"}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-lift"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              {isEdit ? "Edit task" : "New task"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isEdit
                ? "Update this task's details."
                : "Track a piece of work for one of your projects."}
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
              Tasks must belong to a project, so create a project before adding
              tasks.
            </p>
            <Button href="/dashboard/projects" className="mt-4">
              Go to projects
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Task" htmlFor="task-title" required>
              <Input
                id="task-title"
                name="title"
                defaultValue={task?.title ?? ""}
                placeholder="e.g. Review homepage copy"
                required
              />
            </Field>

            <Field label="Description" htmlFor="task-description">
              <Textarea
                id="task-description"
                name="description"
                defaultValue={task?.description ?? ""}
                placeholder="Add context (optional)"
              />
            </Field>

            {preselectedProjectId ? (
              <input
                type="hidden"
                name="projectId"
                value={preselectedProjectId}
              />
            ) : null}
            <Field label="Project" htmlFor="task-project" required>
              <Select
                id="task-project"
                name="projectId"
                defaultValue={preselectedProjectId ?? task?.projectId ?? ""}
                required
                disabled={Boolean(preselectedProjectId)}
              >
                <option value="" disabled>
                  {preselectedName ?? "Select a project…"}
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status" htmlFor="task-status">
                <Select
                  id="task-status"
                  name="status"
                  defaultValue={task?.status ?? "todo"}
                >
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </Select>
              </Field>
              <Field label="Priority" htmlFor="task-priority">
                <Select
                  id="task-priority"
                  name="priority"
                  defaultValue={task?.priority ?? "medium"}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </Field>
            </div>

            <Field label="Due date" htmlFor="task-due">
              <Input
                id="task-due"
                name="dueDate"
                type="date"
                defaultValue={task?.dueDate ?? ""}
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
                {isEdit ? "Save changes" : "Create task"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
