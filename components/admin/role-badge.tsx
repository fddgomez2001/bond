import { ShieldCheck, Store, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

export const roleMeta: Record<UserRole, { label: string; icon: typeof UserRound; badge: string }> = {
  customer: { label: "Customer", icon: UserRound, badge: "bg-bond-yellow/50 text-bond-ink" },
  vendor: { label: "Vendor", icon: Store, badge: "bg-bond-slate/10 text-bond-slate" },
  admin: { label: "Admin", icon: ShieldCheck, badge: "bg-bond-ink text-white" },
};

export function RoleBadge({ role, className }: { role: UserRole; className?: string }) {
  const meta = roleMeta[role];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        meta.badge,
        className,
      )}
    >
      <meta.icon className="size-3.5" aria-hidden />
      {meta.label}
    </span>
  );
}
