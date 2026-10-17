"use client";

import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

/** True while a page-change view transition is running. */
function inPageTransition() {
  try {
    return document.documentElement.matches(":active-view-transition");
  } catch {
    return false; // Browser without the selector: keep the normal reveal.
  }
}

/**
 * Fades and lifts its content in the first time it scrolls into view.
 * Styles live in globals.css ([data-reveal]); content stays visible when
 * JavaScript is off or the user prefers reduced motion. Once revealed it
 * stays revealed, so coming back to a page doesn't replay anything.
 */
export function Reveal({
  children,
  delay = 0,
  variant = "up",
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  /** Milliseconds, for staggering items in a row. */
  delay?: number;
  variant?: "up" | "scale";
  className?: string;
  as?: "div" | "li" | "section" | "article";
}) {
  const ref = useRef<HTMLElement>(null);

  // Arriving on a page: whatever is already on screen belongs to that page,
  // so it comes in with the page crossfade instead of rising up afterwards.
  // (Layout effect: runs before the new page is captured for the fade.)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || el.hasAttribute("data-revealed") || !inPageTransition()) return;
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.setAttribute("data-reveal-instant", "");
      el.setAttribute("data-revealed", "");
    }
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.hasAttribute("data-revealed")) return;

    if (!("IntersectionObserver" in window)) {
      el.setAttribute("data-revealed", "");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-revealed", "");
          observer.disconnect();
        }
      },
      // Trigger as soon as the top edge is a little way into the viewport.
      // (A ratio threshold could never be met by blocks taller than the screen.)
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      data-reveal={variant === "scale" ? "scale" : ""}
      className={className}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
