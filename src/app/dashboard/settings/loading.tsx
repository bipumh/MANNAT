import { Panel } from "@/components/dashboard/panel";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-28 animate-pulse rounded-md bg-surface-2" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-surface-2" />
      </div>

      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-24 animate-pulse rounded-lg bg-surface-2"
          />
        ))}
      </div>

      <Panel>
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded-md bg-surface-2" />
          <div className="h-12 w-full animate-pulse rounded-lg bg-surface-2" />
          <div className="h-12 w-full animate-pulse rounded-lg bg-surface-2" />
          <div className="flex justify-end">
            <div className="h-9 w-20 animate-pulse rounded-lg bg-surface-2" />
          </div>
        </div>
      </Panel>
    </div>
  );
}
