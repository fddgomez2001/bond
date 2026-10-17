import Link from "next/link";
import { BadgeCheck, Hourglass, RotateCcw, Wallet, type LucideIcon } from "lucide-react";
import { EmptyState, KindBadge, Price } from "@/components/marketplace/bits";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/ui/reveal";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { formatDateTime, formatPeso } from "@/lib/format";
import { kindMeta, type ListingKind, type PaymentStatus } from "@/lib/marketplace/constants";
import type { VendorOrderRow } from "@/lib/marketplace/vendor-data";
import { cn } from "@/lib/utils";

const paymentTone: Record<PaymentStatus, { label: string; tone: string }> = {
  unpaid: { label: "Unpaid", tone: "bg-bond-ink/10 text-bond-ink/70" },
  held: { label: "Held by BOND", tone: "bg-amber-100 text-amber-900" },
  released: { label: "Released", tone: "bg-emerald-100 text-emerald-900" },
  refunded: { label: "Refunded", tone: "bg-bond-ink/10 text-bond-ink/70" },
};

/** Vendor Sales: what's held, what's been released, and every paid order. */
export function SalesView({ orders }: { orders: VendorOrderRow[] }) {
  const sum = (status: PaymentStatus, kind?: ListingKind) =>
    orders.filter((o) => o.payment_status === status && (!kind || o.kind === kind)).reduce((t, o) => t + Number(o.total), 0);
  const cards: { label: string; value: number; hint: string; icon: LucideIcon; accent?: boolean }[] = [
    { label: "Released to you", value: sum("released"), hint: "Customers confirmed these orders", icon: BadgeCheck, accent: true },
    { label: "Held by BOND", value: sum("held"), hint: "Released when customers confirm", icon: Hourglass },
    { label: "Refunded", value: sum("refunded"), hint: "Declined, cancelled or refunded after a report", icon: RotateCcw },
  ];
  const released = sum("released");

  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow="Vendor · Sales"
        title="Sales"
        description="Customers pay BOND up front. We hold the payment while you deliver, then release it when the customer confirms."
      />
      <WorkspaceContent>
        <Alert tone="info" className="mb-6">
          Payments are in <strong>test mode</strong> — no real money moves yet. Bank payouts are set up when a payment provider
          (e.g. PayMongo) is connected.
        </Alert>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {cards.map((card, index) => (
            <Reveal as="li" key={card.label} delay={index * 70}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-3xl border p-5",
                  card.accent ? "border-bond-slate bg-bond-slate text-white" : "border-bond-ink/8 bg-white text-bond-ink shadow-[var(--shadow-card)]",
                )}
              >
                <span className="flex items-center justify-between">
                  <span className={cn("text-sm font-semibold", card.accent ? "text-white/80" : "text-bond-ink/60")}>{card.label}</span>
                  <card.icon className={cn("size-5", card.accent ? "text-bond-yellow" : "text-bond-slate")} aria-hidden />
                </span>
                <span className="mt-3 font-heading text-3xl font-bold">{formatPeso(card.value)}</span>
                <span className={cn("mt-1 text-xs", card.accent ? "text-white/70" : "text-bond-ink/55")}>{card.hint}</span>
              </div>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={100}>
          <section className="mt-6 rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
            <h2 className="font-heading text-base font-bold text-bond-ink">Released by type</h2>
            <ul className="mt-4 space-y-3">
              {(Object.keys(kindMeta) as ListingKind[]).map((kind) => {
                const value = sum("released", kind);
                return (
                  <li key={kind}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-bond-ink/75">{kindMeta[kind].plural}</span>
                      <span className="font-semibold text-bond-ink">{formatPeso(value)}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bond-ink/5" aria-hidden>
                      <div
                        className="h-full rounded-full bg-bond-amber transition-[width] duration-700 ease-smooth"
                        style={{ width: released ? `${(value / released) * 100}%` : "0%" }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </Reveal>

        <section className="mt-6">
          <h2 className="font-heading text-xl font-bold text-bond-ink">Paid orders</h2>
          {orders.length === 0 ? (
            <EmptyState icon={Wallet} title="No sales yet" className="mt-4">
              Your paid orders and their payment status will show up here.
            </EmptyState>
          ) : (
            <div className="mt-4 overflow-hidden rounded-3xl border border-bond-ink/8 bg-white shadow-[var(--shadow-card)]">
              <ul className="divide-y divide-bond-ink/8">
                {orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/dashboard/vendor/orders/${order.id}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-sm transition-colors hover:bg-bond-paper"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-bond-ink">{order.order_number}</span>
                          <KindBadge kind={order.kind} className="bg-bond-yellow/40! shadow-none!" />
                        </span>
                        <span className="text-xs text-bond-ink/55">{formatDateTime(order.created_at)}</span>
                      </span>
                      <span className={cn("rounded-full px-3 py-1 text-xs font-bold", paymentTone[order.payment_status].tone)}>
                        {paymentTone[order.payment_status].label}
                      </span>
                      <Price amount={order.total} className="w-28 text-right font-heading font-bold text-bond-ink" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </WorkspaceContent>
    </main>
  );
}
