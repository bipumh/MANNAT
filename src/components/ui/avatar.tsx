import { cn } from "@/lib/cn";

export function Avatar({
  initials,
  className,
  tone = "neutral",
}: {
  initials: string;
  className?: string;
  tone?: "neutral" | "primary";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium",
        tone === "primary"
          ? "bg-primary-soft text-primary-bright"
          : "bg-surface-3 text-muted",
        className,
      )}
    >
      {initials}
    </span>
  );
}
