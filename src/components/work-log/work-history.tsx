import { Badge } from "@/components/ui/badge";
import { formatDateShort, formatDuration } from "@/lib/format";
import type { WorkLog } from "@/types";

export function WorkHistory({ logs }: { logs: WorkLog[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-dim">No work recorded yet.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {logs.map((log) => (
        <li
          key={log.id}
          className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="text-sm text-foreground">
              <span className="font-medium">{log.userName ?? "Someone"}</span>
              <span className="text-dim"> · {formatDateShort(log.workDate)}</span>
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-muted">
              {log.description}
            </p>
            {log.taskTitle ? (
              <p className="mt-0.5 text-xs text-dim">Task: {log.taskTitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="text-sm font-medium tabular-nums text-foreground">
              {formatDuration(log.durationMinutes)}
            </span>
            {log.billable ? (
              <Badge variant="success">Billable</Badge>
            ) : (
              <Badge variant="neutral">Non-billable</Badge>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
