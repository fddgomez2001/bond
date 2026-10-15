"use client";

import { useState } from "react";
import { z } from "zod";

const emailSchema = z.string().trim().pipe(z.email());

/** Static for Phase 1 — newsletter sign-ups aren't stored anywhere yet. */
export function NewsletterForm() {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const input = new FormData(event.currentTarget).get("email");
        if (!emailSchema.safeParse(input).success) {
          setMessage({ ok: false, text: "Enter a valid email address." });
          return;
        }
        setMessage({ ok: true, text: "Thanks! Newsletter sign-ups open soon — we haven't saved your email." });
        event.currentTarget.reset();
      }}
      className="mt-4"
    >
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your Email"
          className="h-14 min-w-0 flex-1 rounded-lg bg-bond-night px-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-4 focus:ring-white/40"
        />
        <button
          type="submit"
          className="h-14 shrink-0 rounded-xl bg-white px-6 font-medium text-bond-ink transition-colors hover:bg-bond-cream sm:px-10"
        >
          Subscribe
        </button>
      </div>
      {message && (
        <p role="status" className={message.ok ? "mt-2 text-sm text-bond-slate" : "mt-2 text-sm text-red-800"}>
          {message.text}
        </p>
      )}
    </form>
  );
}
