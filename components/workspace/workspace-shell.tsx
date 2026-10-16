"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const ShellContext = createContext<{ closeSidebar: () => void }>({ closeSidebar: () => {} });

/** Lets sidebar links close the phone drawer after a tap. */
export const useWorkspaceShell = () => useContext(ShellContext);

/**
 * Admin / vendor workspace frame: a fixed sidebar on desktop; on phones and
 * tablets the same sidebar slides in from the left behind a menu button.
 */
export function WorkspaceShell({
  label,
  homeHref,
  sidebar,
  children,
}: {
  label: string;
  homeHref: string;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => desktop.matches && setOpen(false);
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden"; // no background scrolling behind the drawer
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      root.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  return (
    <ShellContext value={{ closeSidebar: () => setOpen(false) }}>
      <div className="min-h-dvh bg-bond-paper lg:pl-72">
        {/* Phone / tablet top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-bond-slate px-3 py-2.5 shadow-[0_8px_24px_-12px_rgba(29,33,48,0.5)] sm:px-5 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="workspace-sidebar"
            className="inline-flex size-11 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 active:scale-95"
          >
            <Menu className="size-6" aria-hidden />
            <span className="sr-only">Open menu</span>
          </button>
          <Logo tone="light" href={homeHref} className="w-[104px] sm:w-[120px]" />
          <span className="rounded-full bg-bond-yellow px-2.5 py-1 text-[0.65rem] font-bold tracking-wider text-bond-ink uppercase">
            {label}
          </span>
        </header>

        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className={cn(
            "fixed inset-0 z-40 bg-bond-ink/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        />

        <aside
          id="workspace-sidebar"
          aria-label={label}
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,86vw)] flex-col bg-bond-slate text-white lg:w-72",
            "transition-[transform,visibility] duration-300 ease-smooth",
            open ? "visible translate-x-0 shadow-2xl" : "max-lg:invisible max-lg:-translate-x-full",
          )}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-3 inline-flex size-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="size-5" aria-hidden />
            <span className="sr-only">Close menu</span>
          </button>
          {sidebar}
        </aside>

        <div className="flex min-h-dvh flex-col max-lg:min-h-[calc(100dvh-4rem)]">{children}</div>
      </div>
    </ShellContext>
  );
}
