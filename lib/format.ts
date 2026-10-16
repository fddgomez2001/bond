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
