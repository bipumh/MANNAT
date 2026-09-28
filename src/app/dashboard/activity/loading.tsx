import { Panel } from "@/components/dashboard/panel";

export default function ActivityLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-7 w-28 animate-pulse rounded-md bg-surface-2" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-surface-2" />
      </div>

      <div className="h-10 w-72 animate-pulse rounded-lg bg-surface-2" />

      <Panel>
        <div className="space-y-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-surface-2" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded-md bg-surface-2" />
                <div className="h-3 w-64 animate-pulse rounded-md bg-surface-2" />
                <div className="h-3 w-20 animate-pulse rounded-md bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
