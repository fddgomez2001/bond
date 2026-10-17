"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * Runs every time the homepage becomes visible — on first load and when
 * the user comes back to it (Next.js keeps visited pages alive, so effects
 * re-run on return):
 *  - shows the hero at the top unless the URL targets a section (#faq);
 *  - after the first entrance, marks the hero as seen for this tab so its
 *    animation and image fade don't replay.
 */
export function HomeEnterEffects() {
  // Before the first frame (and before the page-change snapshot), so the
  // hero is already in place instead of jumping or scrolling up afterwards.
  useLayoutEffect(() => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (root.hasAttribute("data-hero-seen")) return;
    const timer = window.setTimeout(() => {
      root.setAttribute("data-hero-seen", "");
      try {
        sessionStorage.setItem("bond-hero-seen", "1");
      } catch {
        // Private mode can block storage; the entrance would simply replay.
      }
    }, 1800);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
