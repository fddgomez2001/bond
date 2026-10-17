"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { siteHeaderTransition } from "@/components/ui/page-transition";
import { homeNav } from "@/lib/config/site";
import { cn } from "@/lib/utils";

/**
 * Homepage header. `actions` holds the Login / Sign up (or Dashboard)
 * buttons; it is rendered by the server so it can reflect the session.
 */
export function Navbar({ actions }: { actions: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("home");

  // Layout effects measure before the first frame: coming back to the
  // homepage (kept alive in memory) mustn't flash the old scrolled header
  // or the section that was highlighted when you left.
  useLayoutEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section currently in view, like the bold item in the design.
  useLayoutEffect(() => {
    const sections = homeNav
      .map((item) => (item.section ? document.getElementById(item.section) : null))
      .filter((el): el is HTMLElement => Boolean(el));
    const syncNow = () => {
      const line = window.innerHeight * 0.45;
      const current = sections.find((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= line && r.bottom > line;
      });
      setActive(current?.id ?? "home");
    };
    syncNow();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    // Rotating a tablet or resizing to desktop width closes the phone menu.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => desktop.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  return (
    <header
      style={siteHeaderTransition}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-smooth",
        open
          ? "bg-bond-yellow shadow-[0_18px_40px_-16px_rgba(56,73,73,0.45)]"
          : scrolled
            ? "bg-bond-yellow/90 shadow-[0_8px_30px_-12px_rgba(56,73,73,0.35)] backdrop-blur-md"
            : "bg-transparent",
      )}
    >
      <nav
        aria-label="Main"
        className={cn(
          "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-[padding] duration-500 ease-smooth sm:px-8 lg:px-10 2xl:max-w-[86rem]",
          scrolled ? "py-2.5" : "py-3.5 lg:py-6",
        )}
      >
        <Logo tone="light" eager />

        <ul className="hidden items-center gap-6 lg:flex xl:gap-8">
          {homeNav.map((item) => {
            const isActive = active === item.section;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative py-1 text-[0.95rem] font-medium tracking-[-0.01em] transition-colors duration-300 hover:text-[#141414] xl:text-base",
                    // Animated underline for the section in view.
                    "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-bond-slate after:transition-transform after:duration-500 after:ease-smooth",
                    isActive ? "text-[#141414] after:scale-x-100" : "text-[#141414]/70 after:scale-x-0 hover:after:scale-x-100",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-5 lg:flex">{actions}</div>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-xl text-bond-slate transition-colors duration-300 hover:bg-white/30 active:scale-95 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative size-6">
            <Menu
              className={cn(
                "absolute inset-0 size-6 transition-all duration-300 ease-smooth",
                open ? "scale-50 rotate-90 opacity-0" : "opacity-100",
              )}
              aria-hidden
            />
            <X
              className={cn(
                "absolute inset-0 size-6 transition-all duration-300 ease-smooth",
                open ? "opacity-100" : "scale-50 -rotate-90 opacity-0",
              )}
              aria-hidden
            />
          </span>
        </button>
      </nav>

      {/* Collapses smoothly: grid rows animate from 0fr to 1fr. */}
      <div
        id="mobile-menu"
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-500 ease-smooth lg:hidden",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-bond-slate/10 px-4 pb-6 sm:px-8">
            <ul className="flex flex-col py-2">
              {homeNav.map((item, index) => (
                <li
                  key={item.href}
                  className={cn(
                    "transition-[opacity,transform] duration-500 ease-smooth",
                    open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
                  )}
                  style={{ transitionDelay: open ? `${80 + index * 40}ms` : "0ms" }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-3 text-base transition-colors duration-300 hover:bg-white/30",
                      active === item.section ? "font-semibold text-[#141414]" : "text-[#141414]/75",
                    )}
                  >
                    {item.label}
                    {active === item.section && <span className="size-1.5 rounded-full bg-bond-slate" aria-hidden />}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4 border-t border-bond-slate/10 pt-4">{actions}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
