"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Controlled native <dialog>: focus trap, Esc and the fade/rise animation
 * (dialog.bond-dialog in globals.css) come for free.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clicking the backdrop closes the dialog.
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "bond-dialog m-auto max-h-[calc(100dvh-2rem)] w-[min(30rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl bg-white p-0 text-bond-ink shadow-2xl",
        className,
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-heading text-lg font-bold text-bond-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mt-1 -mr-2 rounded-full p-2 text-bond-ink/55 transition-colors hover:bg-bond-ink/5 hover:text-bond-ink"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {description && <div className="mt-1 text-sm text-bond-ink/65">{description}</div>}
        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}
