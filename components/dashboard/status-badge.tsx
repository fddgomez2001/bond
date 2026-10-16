import { CircleCheckBig, Clock3, RotateCcw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/types/database";

export const statusMeta: Record<
  VerificationStatus,
  { label: string; icon: typeof Clock3; badge: string; dot: string }
> = {
  pending_review: { label: "Pending review", icon: Clock3, badge: "bg-amber-100 text-amber-900", dot: "bg-amber-500" },
  needs_resubmission: {
    label: "Needs resubmission",
    icon: RotateCcw,
    badge: "bg-orange-100 text-orange-900",
    dot: "bg-orange-500",
  },
  approved: { label: "Approved", icon: CircleCheckBig, badge: "bg-emerald-100 text-emerald-900", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", icon: XCircle, badge: "bg-red-100 text-red-900", dot: "bg-red-500" },
};

export function StatusBadge({ status, className }: { status: VerificationStatus; className?: string }) {
  const meta = statusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap",
        meta.badge,
        className,
      )}
    >
      <meta.icon className="size-3.5" aria-hidden />
      {meta.label}
    </span>
  );
}
