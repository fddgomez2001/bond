"use client";

import { useEffect, useState } from "react";

/** Countdown in whole seconds, used to space out "resend code" requests. */
export function useCooldown(initialSeconds = 0) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return { secondsLeft, start: (seconds: number) => setSecondsLeft(seconds), active: secondsLeft > 0 };
}
