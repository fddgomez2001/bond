import { siteConfig } from "@/lib/config/site";

/** "1999-03-04" → "March 4, 1999" without timezone drift. */
export function formatDateOnly(isoDate: string | null) {
  if (!isoDate) return "Not provided";
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

/** Timestamp → "October 2026". */
export function formatMonthYear(timestamp: string | null) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(timestamp));
}

/** Timestamp → "Oct 16, 2026, 9:41 AM" in Philippine time (servers run in UTC). */
export function formatDateTime(timestamp: string | null) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(timestamp));
}

/** 0 → "₱0", 1499 → "₱1,499", 1499.5 → "₱1,499.50". */
export function formatPeso(amount: number) {
  const { code, locale } = siteConfig.currency;
  const whole = Number.isInteger(amount);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** "just now", "5 min ago", "3 h ago", "2 days ago" — then the date. */
export function formatTimeAgo(timestamp: string, now: number) {
  const seconds = Math.max(0, Math.round((now - new Date(timestamp).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDateTime(timestamp);
}
