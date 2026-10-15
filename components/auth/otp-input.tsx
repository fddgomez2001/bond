"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

const LENGTH = 6;

/** Six single-digit boxes with paste, arrow-key and backspace support. */
export function OtpInput({
  value,
  onChange,
  invalid,
  disabled,
  label = "Verification code",
  errorId,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  label?: string;
  errorId?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");

  const focus = (index: number) => refs.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus();

  function setDigit(index: number, digit: string) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, LENGTH));
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    focus(pasted.length);
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      setDigit(index - 1, "");
      focus(index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focus(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focus(index + 1);
    }
  }

  return (
    <div role="group" aria-label={label} aria-describedby={errorId} className="flex gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="\d*"
          maxLength={LENGTH}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${LENGTH}`}
          aria-invalid={invalid || undefined}
          onPaste={onPaste}
          onKeyDown={(event) => onKeyDown(index, event)}
          onFocus={(event) => event.target.select()}
          onChange={(event) => {
            const typed = event.target.value.replace(/\D/g, "");
            if (typed.length > 1) {
              // Autofill or fast typing can deliver several digits at once.
              const merged = (digits.slice(0, index).join("") + typed).slice(0, LENGTH);
              onChange(merged);
              focus(merged.length);
              return;
            }
            setDigit(index, typed);
            if (typed) focus(index + 1);
          }}
          className={cn(
            "h-14 w-full min-w-0 rounded-xl border bg-white text-center font-heading text-2xl font-semibold text-bond-ink shadow-sm sm:h-16",
            "focus:outline-none focus:ring-4",
            invalid
              ? "border-red-400 focus:ring-red-100"
              : "border-bond-ink/15 focus:border-bond-slate focus:ring-bond-yellow/40",
            "disabled:bg-bond-ink/5",
          )}
        />
      ))}
    </div>
  );
}
