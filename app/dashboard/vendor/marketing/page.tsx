import type { Metadata } from "next";
import Link from "next/link";
import { BadgePercent, Camera, Megaphone, MessageSquareHeart, Sparkles, Store, TicketPercent } from "lucide-react";
import { EmptyState } from "@/components/marketplace/bits";
import { buttonClasses } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/page-transition";
import { Reveal } from "@/components/ui/reveal";
import { CopyLink } from "@/components/vendor/copy-link";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { getMyShop, requireApprovedVendor } from "@/lib/marketplace/vendor-data";

export const metadata: Metadata = { title: "Marketing" };

const tips = [
  { icon: Camera, title: "Use bright, real photos", text: "Listings with a clear photo get noticed first on your shop page." },
  { icon: Sparkles, title: "Say what's included", text: "Sizes, inclusions and delivery areas answer questions before they're asked." },
  { icon: MessageSquareHeart, title: "Deliver, then ask", text: "Customers rate you after confirming. Great service shows up as stars." },
];

/**
 * The flowchart's "Marketing" box had no steps yet, so this starts with what
 * works today: sharing your shop link. Paid promotions come later.
 */
export default async function VendorMarketingPage() {
  await requireApprovedVendor();
  const shop = await getMyShop();

  return (
    <PageTransition>
      <main className="flex flex-1 flex-col">
        <WorkspaceHeader
          eyebrow="Vendor · Marketing"
          title="Marketing"
          description="Bring customers straight to your shop and make your listings stand out."
        />
        <WorkspaceContent>
          {!shop ? (
            <EmptyState
              icon={Store}
              title="Set up your shop first"
              action={
                <Link href="/dashboard/vendor/shop" className={buttonClasses({ variant: "gold" })}>
                  Set up my shop
                </Link>
              }
            >
              You&apos;ll get a shareable shop link as soon as your shop exists.
            </EmptyState>
          ) : (
            <div className="space-y-6">
              <Reveal>
                <section className="rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
                  <h2 className="flex items-center gap-2 font-heading text-base font-bold text-bond-ink">
                    <Megaphone className="size-5 text-bond-slate" aria-hidden /> Share your shop
                  </h2>
                  <p className="mt-1 mb-4 text-sm text-bond-ink/65">
                    Post it on Facebook, Instagram or in group chats. Anyone can browse; they log in to order.
                  </p>
                  <CopyLink path={`/shops/${shop.slug}`} title={shop.name} />
                </section>
              </Reveal>

              <ul className="grid gap-4 md:grid-cols-3">
                {tips.map((tip, index) => (
                  <Reveal as="li" key={tip.title} delay={index * 70}>
                    <div className="h-full rounded-3xl border border-bond-ink/8 bg-white p-5 shadow-[var(--shadow-card)]">
                      <span className="flex size-10 items-center justify-center rounded-2xl bg-bond-yellow/40 text-bond-slate">
                        <tip.icon className="size-5" aria-hidden />
                      </span>
                      <p className="mt-3 font-heading font-semibold text-bond-ink">{tip.title}</p>
                      <p className="mt-1 text-sm text-bond-ink/65">{tip.text}</p>
                    </div>
                  </Reveal>
                ))}
              </ul>

              <Reveal delay={120}>
                <section className="rounded-3xl bg-bond-slate p-6 text-white">
                  <p className="text-xs font-bold tracking-wider text-bond-yellow uppercase">Coming soon</p>
                  <h2 className="mt-1 font-heading text-lg font-bold">Promotions & featured listings</h2>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    <li className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm">
                      <TicketPercent className="size-5 text-bond-yellow" aria-hidden /> Discount codes for your shop
                    </li>
                    <li className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm">
                      <BadgePercent className="size-5 text-bond-yellow" aria-hidden /> Featured spots on the Shops page
                    </li>
                  </ul>
                </section>
              </Reveal>
            </div>
          )}
        </WorkspaceContent>
      </main>
    </PageTransition>
  );
}
