import { Check, CircleDot } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { progressSteps, type ListingKind, type OrderStatus } from "@/lib/marketplace/constants";
import { cn } from "@/lib/utils";
import type { OrderEvent } from "@/types/marketplace";

/** Happy-path progress bar (Booked → Preparing → … → Received). */
export function OrderProgress({ kind, status }: { kind: ListingKind; status: OrderStatus }) {
  if (["awaiting_payment", "cancelled", "disputed"].includes(status)) return null;
  const steps = progressSteps(kind);
  const effective = status === "delivery_failed" ? "ready" : status;
  const currentIndex = Math.max(0, steps.findIndex((s) => s.status === effective));
  return (
    <ol className="grid gap-3 sm:grid-flow-col sm:auto-cols-fr">
      {steps.map((step, index) => {
        const done = index < currentIndex || (index === currentIndex && status === "completed");
        const current = index === currentIndex && status !== "completed";
        return (
          <li key={step.status} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
            <span className="flex w-full items-center gap-2">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-500",
                  done && "bg-bond-slate text-white",
                  current && "bg-bond-yellow text-bond-ink ring-4 ring-bond-yellow/30",
                  !done && !current && "bg-bond-ink/8 text-bond-ink/35",
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : <CircleDot className="size-4" aria-hidden />}
              </span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn("hidden h-1 flex-1 rounded-full sm:block", index < currentIndex ? "bg-bond-slate" : "bg-bond-ink/8")}
                />
              )}
            </span>
            <span className={cn("text-sm", current ? "font-semibold text-bond-ink" : done ? "text-bond-ink/80" : "text-bond-ink/45")}>
              {step.label}
              {current && status === "delivery_failed" && <span className="block text-xs text-orange-700">Delivery being retried</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const actorLabel: Record<OrderEvent["actor_role"], string> = {
  customer: "You",
  vendor: "Shop",
  admin: "BOND",
  system: "BOND",
};

/** Everything that has happened to the order, newest first. */
export function OrderTimeline({ events, viewer }: { events: OrderEvent[]; viewer: "customer" | "vendor" }) {
  const ordered = [...events].reverse();
  return (
    <ol className="space-y-4">
      {ordered.map((event, index) => (
        <li key={event.id} className="relative flex gap-3 pl-1">
          <span
            className={cn(
              "relative z-10 mt-1 size-3 shrink-0 rounded-full",
              index === 0 ? "bg-bond-amber ring-4 ring-bond-amber/20" : "bg-bond-ink/20",
            )}
          />
          {index < ordered.length - 1 && <span aria-hidden className="absolute top-4 left-[9px] h-full w-px bg-bond-ink/10" />}
          <div className="min-w-0 pb-1">
            <p className="text-sm text-bond-ink">{event.message}</p>
            <p className="mt-0.5 text-xs text-bond-ink/50">
              {viewer === "vendor" && event.actor_role === "customer" ? "Customer" : viewer === "vendor" && event.actor_role === "vendor" ? "You" : actorLabel[event.actor_role]}
              {" · "}
              {formatDateTime(event.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
