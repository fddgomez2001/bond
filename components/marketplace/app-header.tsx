import { Suspense } from "react";
import Link from "next/link";
import { LayoutDashboard, ShoppingCart } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AccountMenu } from "@/components/dashboard/account-menu";
import { GuestActions } from "@/components/layout/nav-auth-actions";
import { buttonClasses } from "@/components/ui/button";
import { siteHeaderTransition } from "@/components/ui/page-transition";
import { dashboardPathFor } from "@/lib/auth/routes";
import { getCurrentAccount } from "@/lib/auth/session";
import { cartCount } from "@/lib/marketplace/customer-data";
import type { UserRole } from "@/types/database";
import { MarketNav, type MarketNavItem } from "./market-nav";

const roleLabel: Record<UserRole, string> = { customer: "Customer", vendor: "Vendor", admin: "Admin" };

function navFor(role: UserRole | undefined): MarketNavItem[] {
  if (role === "customer") {
    return [
      { label: "Home", href: "/dashboard/customer", exact: true },
      { label: "Shops", href: "/shops" },
      { label: "My Orders", href: "/orders" },
    ];
  }
  if (role) return [{ label: "Shops", href: "/shops" }];
  return [
    { label: "Home", href: "/", exact: true },
    { label: "Shops", href: "/shops" },
  ];
}

/**
 * Header for the shops and customer pages. The bar renders instantly; the
 * part that depends on who's signed in streams in.
 */
export function AppHeader() {
  return (
    <header style={siteHeaderTransition} className="sticky top-0 z-40 bg-bond-yellow/95 shadow-[0_8px_30px_-18px_rgba(56,73,73,0.5)] backdrop-blur supports-[backdrop-filter]:bg-bond-yellow/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8 lg:px-10">
        <Logo tone="light" href="/" transitionTypes={["nav-back"]} className="w-[104px] sm:w-[120px]" />
        <Suspense fallback={<SessionFallback />}>
          <SessionArea />
        </Suspense>
      </div>
    </header>
  );
}

function SessionFallback() {
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="hidden h-3 w-40 animate-pulse rounded-full bg-white/50 md:block" />
      <span className="size-10 animate-pulse rounded-full bg-white/50" />
    </div>
  );
}

async function SessionArea() {
  const account = await getCurrentAccount();
  const role = account?.profile?.role;
  const nav = navFor(role);
  const count = role === "customer" ? await cartCount() : 0;

  return (
    <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
      <MarketNav items={nav} />
      {role === "customer" && (
        <Link
          href="/cart"
          className="relative inline-flex size-11 items-center justify-center rounded-full bg-white/40 text-bond-slate transition-all duration-300 ease-smooth hover:bg-white/70 active:scale-95"
        >
          <ShoppingCart className="size-5" aria-hidden />
          <span className="sr-only">Cart{count ? `, ${count} item${count === 1 ? "" : "s"}` : ""}</span>
          {count > 0 && (
            <span
              key={count}
              className="absolute -top-1 -right-1 flex min-w-5 animate-[fade-up_0.4s_var(--ease-spring)_both] items-center justify-center rounded-full bg-bond-slate px-1 text-[0.7rem] font-bold text-white ring-2 ring-bond-yellow"
            >
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Link>
      )}
      {role && role !== "customer" && (
        <Link
          href={dashboardPathFor(role)}
          transitionTypes={["nav-forward"]}
          className={buttonClasses({ variant: "primary", size: "sm", className: "hidden sm:inline-flex" })}
        >
          <LayoutDashboard className="size-4" aria-hidden />
          Dashboard
        </Link>
      )}
      {account ? (
        <AccountMenu
          firstName={account.profile?.first_name ?? null}
          lastName={account.profile?.last_name ?? null}
          email={account.user.email}
          roleLabel={role ? roleLabel[role] : "Member"}
          nav={role === "customer" ? [...nav, { label: "Cart", href: "/cart" }] : [...nav, { label: "Dashboard", href: dashboardPathFor(role) }]}
        />
      ) : (
        <div className="flex items-center gap-3">
          <GuestActions />
        </div>
      )}
    </div>
  );
}

export function MarketFooter() {
  return (
    <footer className="mt-auto border-t border-bond-ink/10 bg-bond-paper">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-bond-ink/60 sm:flex-row sm:px-8 lg:px-10">
        <p>© BOND · Gifts, surprises & event services</p>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-bond-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-bond-ink">
            Terms
          </Link>
          <Link href="/#contact" className="hover:text-bond-ink">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
