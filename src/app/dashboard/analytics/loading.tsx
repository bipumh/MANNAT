import { Panel } from "@/components/dashboard/panel";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-28 animate-pulse rounded-md bg-surface-2" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-surface-2" />
      </div>

      <Panel>
        <div className="h-64 animate-pulse rounded-lg bg-surface-2" />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Panel key={i}>
            <div className="space-y-3">
              <div className="h-4 w-20 animate-pulse rounded-md bg-surface-2" />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 w-full animate-pulse rounded-md bg-surface-2" />
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
