"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";

type NavItem = { label: string; href?: string };

/** Avatar dropdown: account details, mobile navigation and log out. */
export function AccountMenu({
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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="account-menu"
        className="flex items-center gap-2 rounded-full bg-white/40 py-1 pr-3 pl-1 transition-colors duration-300 hover:bg-white/70"
      >
        <span className="relative flex size-9 items-center justify-center rounded-full border-2 border-bond-gold bg-bond-slate text-sm font-bold text-white">
          {initials(firstName, lastName)}
          {/* Signed-in indicator */}
          <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
        </span>
        <span className="hidden text-sm font-semibold text-bond-slate sm:inline">{firstName ?? "Account"}</span>
        <ChevronDown
          className={cn("size-4 text-bond-slate transition-transform duration-300", open && "rotate-180")}
          aria-hidden
        />
        <span className="sr-only">Open account menu</span>
      </button>

      <div
        id="account-menu"
        inert={!open}
        className={cn(
          "absolute right-0 z-30 mt-2 w-[min(18rem,calc(100vw-2rem))] origin-top-right rounded-2xl border border-bond-ink/10 bg-white p-2 shadow-[0_24px_60px_-20px_rgba(29,33,48,0.45)] transition-all duration-300 ease-smooth",
          open ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0",
        )}
      >
        <div className="px-3 py-2">
          <p className="truncate text-sm font-semibold text-bond-ink">
            {[firstName, lastName].filter(Boolean).join(" ") || "BOND member"}
          </p>
          <p className="truncate text-xs text-bond-ink/60">{email}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-emerald-700 uppercase">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Signed in · {roleLabel}
          </p>
        </div>

        {/* The header nav is hidden on small screens, so repeat it here. */}
        <div className="my-1 border-t border-bond-ink/10 md:hidden" />
        <ul className="md:hidden">
          {nav.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm text-bond-ink transition-colors hover:bg-bond-cream"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="flex items-center justify-between px-3 py-2.5 text-sm text-bond-ink/40">
                  {item.label}
                  <span className="text-[0.6rem] font-bold tracking-wide uppercase">Soon</span>
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="my-1 border-t border-bond-ink/10" />
        <SignOutButton />
      </div>
    </div>
  );
}
