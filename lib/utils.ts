type ClassValue = string | false | null | undefined;

/** Joins class names, skipping falsy values. */
export function cn(...classes: ClassValue[]) {
  return classes.filter(Boolean).join(" ");
}

/** "jane.doe@mail.com" → "ja•••@mail.com" for on-screen display. */
export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

export function initials(first?: string | null, last?: string | null) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "B";
}
