"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  ClipboardCheck,
  Flag,
  Globe,
  LayoutDashboard,
  Lock,
  Megaphone,
  PackageCheck,
  PartyPopper,
  Receipt,
  ShoppingBag,
  Star,
  Store,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceShell } from "./workspace-shell";

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  exact?: boolean;
  /** Hidden behind the verification gate for unverified vendors. */
  needsVerification?: boolean;
  transitionTypes?: string[];
};

const config = {
  admin: {
    main: [
      { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/admin/vendors", label: "Vendor Applications", icon: ClipboardCheck, badge: "vendors" },
      { href: "/dashboard/admin/listings", label: "Listing Approvals", icon: PackageCheck, badge: "listings" },
      { href: "/dashboard/admin/orders", label: "Orders", icon: Receipt },
      { href: "/dashboard/admin/reports", label: "Reports", icon: Flag, badge: "reports" },
      { href: "/dashboard/admin/users", label: "User Management", icon: Users },
      { href: "/dashboard/admin/visitors", label: "Site Visitors", icon: Activity },
    ],
    account: [
      { href: "/dashboard/admin/profile", label: "View Profile", icon: UserRound },
      { href: "/", label: "Visit website", icon: Globe, transitionTypes: ["nav-back"] },
    ],
  },
  vendor: {
    main: [
      { href: "/dashboard/vendor", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/vendor/orders", label: "Orders", icon: Receipt, badge: "orders", needsVerification: true },
      { href: "/dashboard/vendor/products", label: "Products", icon: ShoppingBag, needsVerification: true },
      { href: "/dashboard/vendor/services", label: "Services", icon: PartyPopper, needsVerification: true },
      { href: "/dashboard/vendor/sales", label: "Sales", icon: BarChart3, needsVerification: true },
      { href: "/dashboard/vendor/reviews", label: "Reviews", icon: Star, needsVerification: true },
      { href: "/dashboard/vendor/marketing", label: "Marketing", icon: Megaphone, needsVerification: true },
      { href: "/dashboard/vendor/shop", label: "Shop settings", icon: Store, needsVerification: true },
    ],
    account: [{ href: "/", label: "Visit website", icon: Globe, transitionTypes: ["nav-back"] }],
  },
} satisfies Record<string, Record<"main" | "account", Item[]>>;

export type Workspace = keyof typeof config;

type NavProps = {
  workspace: Workspace;
  section: "main" | "account";
  badges?: Record<string, number>;
  verified?: boolean;
};

/** Static version (no active state) shown while the URL streams in. */
export function WorkspaceNavLinks({
  workspace,
  section,
  badges,
  verified = true,
  activeHref,
  onNavigate,
}: NavProps & { activeHref?: string | null; onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {(config[workspace][section] as Item[]).map((item) => {
        const active = activeHref === item.href;
        const locked = item.needsVerification && !verified;
        const count = item.badge ? badges?.[item.badge] : 0;
        const classes = cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-smooth",
          active
            ? "bg-bond-yellow text-bond-ink shadow-[0_10px_24px_-12px_rgba(247,204,21,0.8)]"
            : locked
              ? "cursor-not-allowed text-white/35"
              : "text-white/70 hover:bg-white/[0.08] hover:text-white",
        );
        const content = (
          <>
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-300",
                active ? "bg-bond-slate/15" : "bg-white/[0.06] group-hover:bg-white/10",
              )}
            >
              <item.icon className="size-[18px]" aria-hidden />
            </span>
            <span className="flex-1 truncate">{item.label}</span>
            {locked && <Lock className="size-3.5" aria-label="Verify your account first" />}
            {!locked && count ? (
              <span
                className={cn(
                  "min-w-6 rounded-full px-1.5 py-0.5 text-center text-[0.7rem] font-bold",
                  active ? "bg-bond-slate text-white" : "bg-bond-amber text-bond-ink",
                )}
              >
                {count}
                <span className="sr-only"> waiting</span>
              </span>
            ) : null}
          </>
        );
        return (
          <li key={item.href}>
            {locked ? (
              <span className={classes} title="Verify your account first">
                {content}
              </span>
            ) : (
              <Link
                href={item.href}
                transitionTypes={item.transitionTypes}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={classes}
              >
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Highlights the page you're on. Reads the URL, so render it inside <Suspense>. */
export function WorkspaceNav(props: NavProps) {
  const pathname = usePathname();
  const { closeSidebar } = useWorkspaceShell();
  const activeHref =
    (config[props.workspace][props.section] as Item[]).find((item) =>
      item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.href ?? null;
  return <WorkspaceNavLinks {...props} activeHref={activeHref} onNavigate={closeSidebar} />;
}
