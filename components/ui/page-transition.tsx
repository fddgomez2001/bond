import { ViewTransition, type ReactNode } from "react";

/**
 * Page changes are a calm crossfade (CSS in globals.css): the new page
 * fades in on top while the old one stays fully visible underneath until
 * the new one has nearly arrived, then fades away. Nothing slides, zooms
 * or blurs, and the light page background never shows through in between
 * (that was the white flash). The site header is held still on its own
 * (siteHeaderTransition below). Browsers without View Transitions just swap.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit" default="none">
      {children}
    </ViewTransition>
  );
}

/** Loading screens take part in the same crossfade, in and out. */
export function SkeletonTransition({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}

/**
 * Spread onto each page's top header. During a page change the header
 * switches instantly instead of two headers fading through each other
 * (which showed doubled text like "HHome").
 */
export const siteHeaderTransition = { viewTransitionName: "site-header" } as const;
