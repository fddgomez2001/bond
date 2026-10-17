"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LegalBody, legalNotice, privacyPolicy, termsOfService, type LegalDoc } from "./legal-content";

/**
 * "By registering you agree to the Terms of Service and Privacy Policy."
 * The links open the document in a pop-up, so a half-filled registration
 * form is never lost. They stay real links: Ctrl/Cmd-click (or no
 * JavaScript) still opens the full page.
 */
export function LegalAgreement({ prefix }: { prefix: string }) {
  const [doc, setDoc] = useState<LegalDoc | null>(null);

  const open = (target: LegalDoc) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    setDoc(target);
  };

  return (
    <>
      <p className="text-center text-xs text-bond-ink/55">
        {prefix}{" "}
        <a href={termsOfService.href} onClick={open(termsOfService)} aria-haspopup="dialog" className="underline underline-offset-2 transition-colors hover:text-bond-slate">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href={privacyPolicy.href} onClick={open(privacyPolicy)} aria-haspopup="dialog" className="underline underline-offset-2 transition-colors hover:text-bond-slate">
          Privacy Policy
        </a>
        .
      </p>
      <LegalDialog doc={doc} onClose={() => setDoc(null)} />
    </>
  );
}

function LegalDialog({ doc, onClose }: { doc: LegalDoc | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Keep showing the last document while the dialog fades out.
  const [shown, setShown] = useState<LegalDoc | null>(doc);
  if (doc && doc !== shown) setShown(doc);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (doc && !dialog.open) dialog.showModal();
    if (!doc && dialog.open) dialog.close();
  }, [doc]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clicking the dimmed backdrop closes it.
        if (event.target === ref.current) onClose();
      }}
      className="bond-dialog m-auto w-[min(40rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl bg-white p-0 text-bond-ink shadow-2xl"
    >
      {shown && (
        <div className="flex max-h-[min(44rem,calc(100dvh-1.5rem))] flex-col">
          <header className="relative shrink-0 overflow-hidden bg-bond-yellow px-6 pt-6 pb-5 sm:px-8">
            <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/25 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <h2 id={titleId} className="font-display text-3xl leading-tight tracking-[-0.03em] text-bond-slate sm:text-4xl">
                {shown.title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="-mt-1 -mr-2 shrink-0 rounded-full p-2 text-bond-slate/70 transition-colors hover:bg-white/40 hover:text-bond-slate"
                aria-label="Close"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <p className="relative mt-3 inline-flex rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-bond-slate">
              {legalNotice}
            </p>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-6 py-6 text-[0.95rem] leading-relaxed text-bond-ink/80 sm:px-8">
            <LegalBody doc={shown} headingLevel={3} />
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-bond-ink/8 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <a
              href={shown.href}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-bond-slate transition-colors hover:bg-bond-slate/10"
            >
              Open full page
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
            <Button type="button" onClick={onClose} autoFocus>
              Got it, back to my form
            </Button>
          </footer>
        </div>
      )}
    </dialog>
  );
}
