import { ViewTransition, type ReactNode } from "react";
import Link from "next/link";
import { Flag, MapPin, Phone, Store, UserRound } from "lucide-react";
import { EmptyState, KindBadge, OrderStatusBadge, Price } from "@/components/marketplace/bits";
import { Reveal } from "@/components/ui/reveal";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import type { listReports } from "@/lib/admin/marketplace";
import { formatDateTime } from "@/lib/format";
import { reportReasons } from "@/lib/marketplace/constants";
import { cn } from "@/lib/utils";
import { ReportResolveForm } from "./report-resolve-form";

type Data = Awaited<ReturnType<typeof listReports>>;

const BASE = "/dashboard/admin/reports";

/**
 * Where "Report Transaction" leads (the flowchart ended there). The payment
 * stays held until an admin refunds the customer or releases it to the shop.
 */
export function ReportList({ status, data }: { status: "open" | "resolved"; data: Data }) {
  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow="Admin · Marketplace"
        title="Reports"
        description="Problems customers reported with an order. Talk to both sides if needed, then refund the customer or release the payment."
      />
      <WorkspaceContent>
        <div className="flex gap-2">
          {(["open", "resolved"] as const).map((s) => (
            <Link
              key={s}
              href={s === "open" ? BASE : `${BASE}?status=${s}`}
              scroll={false}
              aria-current={s === status ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ease-smooth",
                s === status ? "border-bond-slate bg-bond-slate text-white" : "border-bond-ink/12 bg-white text-bond-ink/75 hover:border-bond-slate/40",
              )}
            >
              {s === "open" ? "Open" : "Resolved"}
              {s === "open" && <span className={cn("rounded-full px-1.5 text-xs", s === status ? "bg-white/20" : "bg-bond-ink/8")}>{data.openCount}</span>}
            </Link>
          ))}
        </div>

        <ViewTransition key={status} enter="list-in" exit="list-out" default="none">
          <section className="pt-6">
            {data.reports.length === 0 ? (
              <EmptyState icon={Flag} title={status === "open" ? "No open reports" : "No resolved reports yet"}>
                {status === "open" ? "When a customer reports a problem with an order, it shows up here." : undefined}
              </EmptyState>
            ) : (
              <ul className="space-y-4">
                {data.reports.map((report, index) => {
                  const order = report.order;
                  return (
                    <Reveal as="li" key={report.id} delay={Math.min(index, 6) * 50}>
                      <article className="grid grid-cols-1 gap-5 rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] lg:grid-cols-[1fr_22rem]">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-heading font-bold text-bond-ink">{order?.order_number}</span>
                            {order && <KindBadge kind={order.kind} className="bg-bond-yellow/40! shadow-none!" />}
                            {order && <OrderStatusBadge status={order.status} kind={order.kind} />}
                          </div>
                          <p className="mt-3 text-sm font-semibold text-red-800">
                            {reportReasons.find((r) => r.value === report.reason)?.label ?? report.reason}
                          </p>
                          <p className="mt-1 text-sm whitespace-pre-line text-bond-ink/80">{report.details}</p>
                          <p className="mt-1 text-xs text-bond-ink/50">Reported {formatDateTime(report.created_at)}</p>

                          {order && (
                            <dl className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-bond-paper p-4 text-sm sm:grid-cols-2">
                              <Info icon={UserRound} label="Customer">
                                {order.customer_name}
                                {order.customer_phone && (
                                  <a href={`tel:${order.customer_phone}`} className="ml-1 text-bond-slate underline">
                                    {order.customer_phone}
                                  </a>
                                )}
                              </Info>
                              <Info icon={Store} label="Shop">
                                {order.shop?.name}
                                {order.shop?.contact_number && (
                                  <a href={`tel:${order.shop.contact_number}`} className="ml-1 text-bond-slate underline">
                                    <Phone className="mr-0.5 inline size-3" aria-hidden />
                                    {order.shop.contact_number}
                                  </a>
                                )}
                              </Info>
                              {order.delivery_address && (
                                <Info icon={MapPin} label="Delivered to">
                                  {order.recipient_name} · {order.delivery_address}
                                </Info>
                              )}
                              <Info icon={Flag} label="Amount held">
                                <Price amount={order.total} className="font-semibold" />
                              </Info>
                            </dl>
                          )}
                        </div>
                        <div className="rounded-2xl border border-bond-ink/8 p-4">
                          {report.status === "open" ? (
                            <ReportResolveForm reportId={report.id} />
                          ) : (
                            <div className="text-sm">
                              <p className="font-semibold text-bond-ink">
                                {report.resolution === "refund" ? "Customer refunded" : "Payment released to the shop"}
                              </p>
                              {report.admin_note && <p className="mt-1 text-bond-ink/75">{report.admin_note}</p>}
                              <p className="mt-2 text-xs text-bond-ink/50">Resolved {formatDateTime(report.resolved_at)}</p>
                            </div>
                          )}
                        </div>
                      </article>
                    </Reveal>
                  );
                })}
              </ul>
            )}
          </section>
        </ViewTransition>
      </WorkspaceContent>
    </main>
  );
}

function Info({ icon: Icon, label, children }: { icon: typeof Flag; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-bond-slate" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs font-semibold tracking-wide text-bond-ink/50 uppercase">{label}</dt>
        <dd className="text-bond-ink/85">{children}</dd>
      </div>
    </div>
  );
}
