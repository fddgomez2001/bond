import { ViewTransition, type ReactNode } from "react";

/**
 * Animates a page's content during navigation (View Transitions API; see
 * the ::view-transition rules in globals.css).
 *  - Links tagged transitionTypes={["nav-forward"]} or ["nav-back"] fade
 *    the old page out with a slight zoom.
 *  - The new page always rises and fades in.
 * Browsers without View Transitions simply navigate normally.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter="page-in"
      exit={{ "nav-forward": "page-out", "nav-back": "page-out", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}

/** Wraps a loading skeleton so it slides in, then fades away as content arrives. */
export function SkeletonTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="skeleton-out" default="none">
      {children}
    </ViewTransition>
  );
}
