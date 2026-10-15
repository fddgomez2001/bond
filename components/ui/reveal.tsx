"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

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
