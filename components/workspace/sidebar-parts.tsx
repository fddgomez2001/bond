import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { getCurrentAccount } from "@/lib/auth/session";
import { initials } from "@/lib/utils";

/** Sidebar layout shared by the admin and vendor workspaces. */
export function SidebarFrame({
  label,
  homeHref,
  nav,
  account,
  accountNav,
}: {
  label: string;
  homeHref: string;
  nav: ReactNode;
  account: ReactNode;
  accountNav: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto overscroll-contain px-4 pt-5 pb-4">
      <div className="flex items-center gap-2 px-2">
        <Logo tone="light" href={homeHref} className="w-[112px]" />
        <span className="rounded-full bg-bond-yellow px-2 py-0.5 text-[0.6rem] font-bold tracking-wider text-bond-ink uppercase">
          {label}
        </span>
      </div>

      <p className="mt-8 mb-2 px-3 text-[0.68rem] font-semibold tracking-[0.18em] text-white/40 uppercase">Menu</p>
      <nav aria-label={`${label} menu`}>{nav}</nav>

      <div className="flex-1" />

      <div className="mt-8 space-y-3 border-t border-white/10 pt-4">
        {account}
        <nav aria-label="Account">{accountNav}</nav>
        <SignOutButton tone="dark" />
      </div>
    </div>
  );
}

export async function AccountCard({ subtitle }: { subtitle?: ReactNode }) {
  const account = await getCurrentAccount();
  const profile = account?.profile;
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Your account";
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3">
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-bond-gold bg-bond-slate-light text-sm font-bold">
        {initials(profile?.first_name, profile?.last_name)}
        <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-bond-slate bg-emerald-400" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{name}</span>
        <span className="block truncate text-xs text-white/55">{subtitle ?? account?.user.email}</span>
      </span>
    </div>
  );
}

export function AccountCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3" aria-hidden>
      <span className="size-10 animate-pulse rounded-full bg-white/15" />
      <span className="flex-1 space-y-2">
        <span className="block h-3 w-24 animate-pulse rounded-full bg-white/15" />
        <span className="block h-2.5 w-32 animate-pulse rounded-full bg-white/10" />
      </span>
    </div>
  );
}
