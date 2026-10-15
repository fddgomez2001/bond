import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { AccountMenu } from "./account-menu";

type NavItem = { label: string; href?: string; soon?: boolean };

export function DashboardHeader({
  firstName,
  lastName,
  email,
  roleLabel,
  nav,
}: {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  roleLabel: string;
  nav: NavItem[];
}) {
  return (
    <header className="sticky top-0 z-40 bg-bond-yellow/95 backdrop-blur supports-[backdrop-filter]:bg-bond-yellow/85">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-10">
        <Logo tone="light" href="/" />

        <nav aria-label="Dashboard" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {nav.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-[0.95rem] text-[#141414]/75 transition-colors duration-300 hover:text-[#141414]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[0.95rem] text-[#141414]/40">
                    {item.label}
                    <span className="rounded-full bg-white/50 px-1.5 py-0.5 text-[0.6rem] font-bold tracking-wide uppercase">
                      Soon
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <AccountMenu firstName={firstName} lastName={lastName} email={email} roleLabel={roleLabel} nav={nav} />
      </div>
    </header>
  );
}

export function DashboardFooter() {
  return (
    <footer className="border-t border-bond-ink/10 bg-bond-paper">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-bond-ink/60 sm:flex-row sm:px-8 lg:px-10">
        <p>BOND — Phase 1 preview</p>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-bond-ink">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-bond-ink">
            Terms of Service
          </Link>
          <Link href="/#contact" className="hover:text-bond-ink">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
