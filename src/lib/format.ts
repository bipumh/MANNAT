const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const currencyPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number): string {
  return currency.format(value);
}

export function formatCurrencyPrecise(value: number): string {
  return currencyPrecise.format(value);
}

export function formatBudget(value: string | null): string {
  if (!value) return "—";
  const n = Number(value);
  return Number.isFinite(n) ? formatCurrencyPrecise(n) : "—";
}

export function budgetToInput(value: string | null): string {
  if (!value) return "";
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : value;
}

export function formatCompact(value: number): string {
  return compact.format(value);
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Normalizes a PostgreSQL `date` value to a plain "YYYY-MM-DD" string with no
 * timezone ambiguity. The Neon driver returns `date` columns as JS `Date`
 * objects at local midnight, so we read the local year/month/day components
 * (which are the true calendar date) rather than the UTC components, which can
 * be shifted by a day depending on the runtime timezone. String inputs are
 * parsed directly so "YYYY-MM-DD" is preserved verbatim.
 */
export function toDateOnlyString(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return null;
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateOnlyParts(value: string | Date, withYear: boolean): string {
  const s = toDateOnlyString(value);
  if (!s) return "";
  const [y, m, d] = s.split("-").map(Number);
  return withYear ? `${MONTHS_SHORT[m - 1]} ${d}, ${y}` : `${MONTHS_SHORT[m - 1]} ${d}`;
}

export function formatDateOnly(iso: string | Date): string {
  return formatDateOnlyParts(iso, true);
}

export function formatDateOnlyShort(iso: string | Date): string {
  return formatDateOnlyParts(iso, false);
}

export function formatRelativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDateShort(iso);
}
