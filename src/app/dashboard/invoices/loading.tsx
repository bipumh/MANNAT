import { Panel } from "@/components/dashboard/panel";

export default function InvoicesLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <div className="h-7 w-28 animate-pulse rounded-md bg-surface-2" />
          <div className="h-4 w-72 animate-pulse rounded-md bg-surface-2" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-surface-2" />
      </div>

      <Panel>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded-md bg-surface-2" />
                <div className="h-3 w-48 animate-pulse rounded-md bg-surface-2" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded-md bg-surface-2" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-surface-2" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
