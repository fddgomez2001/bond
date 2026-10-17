"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type Hints = { model?: string; platform?: string; platformVersion?: string; mobile?: boolean; touchPoints?: number };

type UADataLike = {
  mobile?: boolean;
  getHighEntropyValues?: (keys: string[]) => Promise<{ model?: string; platform?: string; platformVersion?: string; mobile?: boolean }>;
};

let hintsPromise: Promise<Hints> | null = null;

/** Extra device details the browser offers (Chromium shares the phone model). */
function clientHints(): Promise<Hints> {
  if (hintsPromise) return hintsPromise;
  const touchPoints = navigator.maxTouchPoints || 0;
  const uaData = (navigator as Navigator & { userAgentData?: UADataLike }).userAgentData;
  hintsPromise = uaData?.getHighEntropyValues
    ? uaData
        .getHighEntropyValues(["model", "platformVersion"])
        .then((v) => ({
          model: v.model || undefined,
          platform: v.platform || undefined,
          platformVersion: v.platformVersion || undefined,
          mobile: v.mobile ?? uaData.mobile,
          touchPoints,
        }))
        .catch(() => ({ mobile: uaData.mobile, touchPoints }))
    : Promise.resolve({ touchPoints });
  return hintsPromise;
}

let sentFirst = false;

/**
 * Invisible. Each time a page is opened it tells the server which page it
 * was (app/api/track), for the admin "Site Visitors" page. Uses sendBeacon,
 * so it never slows navigation down.
 */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    void clientHints().then((hints) => {
      if (cancelled) return;
      // Where the visitor came from only matters for the first page they open.
      const referrer = sentFirst ? undefined : document.referrer || undefined;
      sentFirst = true;
      const body = JSON.stringify({ path: pathname, referrer, hints });
      const sent = navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }));
      if (!sent) {
        fetch("/api/track", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
