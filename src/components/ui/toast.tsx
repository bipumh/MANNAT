import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function Toast({
  message,
  tone = "success",
}: {
  message: string | null;
  tone?: "success" | "error";
}) {
  if (!message) return null;

  const Icon = tone === "error" ? AlertCircle : CheckCircle2;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        role={tone === "error" ? "alert" : "status"}
        className={cn(
          "flex items-center gap-2.5 rounded-lg border bg-elevated px-4 py-2.5 text-sm font-medium text-foreground shadow-lift",
          tone === "error" ? "border-red-500/40" : "border-primary/30",
        )}
      >
        <Icon
          aria-hidden
          className={cn(
            "h-4 w-4 shrink-0",
            tone === "error" ? "text-red-300" : "text-primary-bright",
          )}
        />
        <span className="min-w-0">{message}</span>
      </div>
    </div>
  );
}
