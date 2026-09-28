import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Geometric MANNAT "M" brand mark — two crisp verticals joined by a central V,
 * drawn with a single path so it stays sharp at every size (favicon to hero).
 * Inherits its color via `currentColor`.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M4 5h7v9l5-6.5L21 14V5h7v22h-7v-8l-5 6.5L11 19v8H4V5Z" />
    </svg>
  );
}

/**
 * App-tile variant — the mark set inside a rounded emerald tile so the lockup
 * reads like a real product logo (icon + wordmark).
 */
export function BrandTile({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[10px] bg-gradient-to-br from-primary-bright to-primary shadow-soft ring-1 ring-inset ring-white/10",
        className,
      )}
    >
      <BrandMark className="h-[55%] w-[55%] text-[#05251c]" />
    </span>
  );
}

/**
 * Text-based MANNAT wordmark. Uppercase, tightly tracked grotesque type.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-[16px] font-semibold uppercase leading-none tracking-[0.16em] text-foreground",
        className,
      )}
    >
      Mannat
    </span>
  );
}

export function Logo({
  className,
  href = "/",
  withTile = true,
}: {
  className?: string;
  href?: string;
  withTile?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label="MANNAT — home"
      className={cn("inline-flex select-none items-center gap-2.5", className)}
    >
      {withTile ? <BrandTile className="h-8 w-8" /> : null}
      <Wordmark />
    </Link>
  );
}
