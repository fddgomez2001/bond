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
