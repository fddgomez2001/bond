import { ViewTransition } from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { EmptyState, KindBadge, OrderStatusBadge, Price } from "@/components/marketplace/bits";
import { Reveal } from "@/components/ui/reveal";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import type { listAllOrders } from "@/lib/admin/marketplace";
import { formatDateTime, formatPeso } from "@/lib/format";
import type { OrderStatus, PaymentStatus } from "@/lib/marketplace/constants";
import { cn } from "@/lib/utils";

type Data = Awaited<ReturnType<typeof listAllOrders>>;

const BASE = "/dashboard/admin/orders";

const paymentLabel: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  held: "Held by BOND",
  released: "Released to shop",
  refunded: "Refunded",
};

export const adminOrderFilters: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "awaiting_payment", label: "Awaiting payment" },
  { value: "paid", label: "Paid" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Out / ready" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Reported" },
  { value: "cancelled", label: "Cancelled" },
];

export const parseAdminOrderFilter = (v: unknown) => adminOrderFilters.find((f) => f.value === v)?.value ?? null;

/** Read-only view of every order and where the money is. */
export function OrderTable({ status, data }: { status: OrderStatus | null; data: Data }) {
  const totals = [
    { label: "Orders", value: String(data.totals.count) },
    { label: "Held by BOND", value: formatPeso(data.totals.held) },
    { label: "Released to shops", value: formatPeso(data.totals.released) },
    { label: "Refunded", value: formatPeso(data.totals.refunded) },
  ];
  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow="Admin · Marketplace"
        title="Orders"
        description="Every gift, surprise and event-service order on BOND. Payments are in test mode."
      />
      <WorkspaceContent>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {totals.map((t, index) => (
            <Reveal as="li" key={t.label} delay={index * 60}>
              <div className="rounded-3xl border border-bond-ink/8 bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
                <p className="text-xs font-semibold text-bond-ink/60 sm:text-sm">{t.label}</p>
                <p className="mt-2 truncate font-heading text-2xl font-bold text-bond-ink sm:text-3xl">{t.value}</p>
              </div>
            </Reveal>
          ))}
        </ul>

        <nav aria-label="Filter by status" className="-mx-1 mt-6 overflow-x-auto px-1 pb-1">
          <ul className="flex w-max gap-2">
            {adminOrderFilters.map((f) => (
              <li key={f.label}>
                <Link
                  href={f.value ? `${BASE}?status=${f.value}` : BASE}
                  scroll={false}
                  aria-current={f.value === status ? "page" : undefined}
                  className={cn(
                    "inline-flex rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-300 ease-smooth",
                    f.value === status ? "border-bond-slate bg-bond-slate text-white" : "border-bond-ink/12 bg-white text-bond-ink/75 hover:border-bond-slate/40",
                  )}
                >
                  {f.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ViewTransition key={status ?? "all"} enter="list-in" exit="list-out" default="none">
          <section className="pt-6">
            {data.orders.length === 0 ? (
              <EmptyState icon={Receipt} title="No orders here" />
            ) : (
              <div className="overflow-hidden rounded-3xl border border-bond-ink/8 bg-white shadow-[var(--shadow-card)]">
                <ul className="divide-y divide-bond-ink/8">
                  {data.orders.map((order) => (
                    <li key={order.id} className="flex flex-col gap-3 px-5 py-4 text-sm lg:flex-row lg:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-heading font-bold text-bond-ink">{order.order_number}</span>
                          <KindBadge kind={order.kind} className="bg-bond-yellow/40! shadow-none!" />
                        </div>
                        <p className="mt-0.5 truncate text-bond-ink/65">
                          {order.customer_name ?? "Customer"} → {order.shop?.name ?? "Shop"}
                        </p>
                        <p className="text-xs text-bond-ink/45">{formatDateTime(order.created_at)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        <span className="text-xs text-bond-ink/55">{paymentLabel[order.payment_status]}</span>
                        <OrderStatusBadge status={order.status} kind={order.kind} />
                        <Price amount={order.total} className="w-24 text-right font-heading font-bold text-bond-ink" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </ViewTransition>
      </WorkspaceContent>
    </main>
  );
}
