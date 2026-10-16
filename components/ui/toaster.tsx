"use client";

import { useEffect, useState, type AnimationEvent } from "react";
import { usePathname } from "next/navigation";
import { CircleCheckBig, Info, LogOut, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "error" | "signed-out";

type ToastInput = { tone: Tone; title: string; message?: string };
type ToastItem = ToastInput & { id: number; leaving?: boolean };

const EVENT = "bond:toast";
const DURATION_MS = 4500;

/** Show a toast from any Client Component. */
export function toast(input: ToastInput) {
  window.dispatchEvent(new CustomEvent<ToastInput>(EVENT, { detail: input }));
}

/* ---------------- flash cookie set by the server (lib/flash.ts) ---------------- */

const FLASH_COOKIE = "bond-flash";

function consumeFlash(): ToastInput | null {
  const raw = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${FLASH_COOKIE}=`))
    ?.slice(FLASH_COOKIE.length + 1);
  if (!raw) return null;
  document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/`;

  try {
    const binary = atob(raw.replace(/-/g, "+").replace(/_/g, "/"));
    const json = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
    const { kind, name } = JSON.parse(json) as { kind: string; name?: string };
    switch (kind) {
      case "signed-in":
        return { tone: "success", title: name ? `Welcome back, ${name}!` : "Welcome back!", message: "You're logged in." };
      case "signed-out":
        return { tone: "signed-out", title: "You've been logged out", message: "See you again soon." };
      case "verified":
        return { tone: "success", title: "Email verified", message: "You're logged in and your account is ready." };
      case "account-created":
        return { tone: "success", title: "Account created", message: "Welcome to BOND! You're logged in." };
      case "password-updated":
        return { tone: "success", title: "Password updated", message: "Log in with your new password." };
      case "session-expired":
        return { tone: "info", title: "Your session has ended", message: "Please log in again to continue." };
      case "vendor-approved":
        return { tone: "success", title: "Vendor approved", message: "Their vendor tools are now unlocked." };
      case "vendor-resubmission":
        return { tone: "info", title: "Resubmission requested", message: "The vendor will see your notes on their dashboard." };
      case "payment-success":
        return { tone: "success", title: "Payment successful", message: "BOND is holding it safely until your order is done." };
      case "listing-submitted":
        return { tone: "success", title: "Submitted for review", message: "An admin will check it before customers can see it." };
      case "vendor-rejected":
        return { tone: "info", title: "Application rejected", message: "The vendor will see your notes on their dashboard." };
    }
  } catch {
    // Ignore a malformed cookie.
  }
  return null;
}

/* ------------------------------------------------------------------------------- */

const tones: Record<Tone, { icon: typeof Info; badge: string; bar: string }> = {
  success: { icon: CircleCheckBig, badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
  info: { icon: Info, badge: "bg-sky-100 text-sky-700", bar: "bg-sky-500" },
  error: { icon: TriangleAlert, badge: "bg-red-100 text-red-700", bar: "bg-red-500" },
  "signed-out": { icon: LogOut, badge: "bg-bond-yellow/60 text-bond-slate", bar: "bg-bond-slate" },
};

export function Toaster() {
  const pathname = usePathname();
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    let nextId = 0;
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastInput>).detail;
      nextId += 1;
      const id = Date.now() + nextId;
      setToasts((current) => [...current.slice(-2), { ...detail, id }]);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  // After every navigation, show any message the server left for us.
  useEffect(() => {
    const flash = consumeFlash();
    if (flash) toast(flash);
  }, [pathname]);

  const dismiss = (id: number) =>
    setToasts((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
  const remove = (id: number) => setToasts((current) => current.filter((t) => t.id !== id));

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:top-5 sm:right-5 sm:items-end"
    >
      {toasts.map((t) => {
        const tone = tones[t.tone];
        const Icon = tone.icon;
        return (
          <div
            key={t.id}
            role="status"
            className="group pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border border-bond-ink/8 bg-white/95 shadow-[0_20px_50px_-20px_rgba(29,33,48,0.45)] backdrop-blur"
            style={{
              animation: t.leaving
                ? "toast-out 0.28s var(--ease-smooth) both"
                : "toast-in 0.5s var(--ease-spring) both",
            }}
            onAnimationEnd={(event: AnimationEvent) => {
              if (event.animationName === "toast-out") remove(t.id);
            }}
          >
            <div className="flex items-start gap-3 p-4 pr-11">
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", tone.badge)}>
                <Icon className="size-4.5" aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="font-heading text-sm font-semibold text-bond-ink">{t.title}</p>
                {t.message && <p className="mt-0.5 text-sm text-bond-ink/65">{t.message}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="absolute top-3 right-3 rounded-full p-1.5 text-bond-ink/45 transition-colors hover:bg-bond-ink/5 hover:text-bond-ink"
              aria-label="Dismiss notification"
            >
              <X className="size-4" aria-hidden />
            </button>
            {!t.leaving && (
              <span
                aria-hidden
                className={cn(
                  "toast-progress absolute inset-x-0 bottom-0 h-1 origin-left group-hover:[animation-play-state:paused]",
                  tone.bar,
                )}
                // Longhands (not the shorthand) so hover can pause it.
                style={{
                  animationName: "toast-progress",
                  animationDuration: `${DURATION_MS}ms`,
                  animationTimingFunction: "linear",
                  animationFillMode: "both",
                }}
                onAnimationEnd={() => dismiss(t.id)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
