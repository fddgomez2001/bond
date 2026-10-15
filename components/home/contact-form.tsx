"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleCheckBig } from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(80),
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(2000),
});

type Values = z.input<typeof contactSchema>;

const darkInput = (invalid: boolean) =>
  cn(
    "w-full rounded-lg border bg-[#14141b] px-4 py-3 text-base text-white transition-[border-color,box-shadow] duration-300 placeholder:text-white/35 focus:outline-none focus:ring-4 sm:text-sm",
    invalid ? "border-red-400 focus:ring-red-500/25" : "border-white/20 focus:border-bond-yellow focus:ring-bond-yellow/20",
  );

/**
 * Static for Phase 1: validates input but does not send anything yet.
 * Wire it to an email service or a Supabase table in a later phase.
 */
export function ContactForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", message: "" } });

  const onSubmit = handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSent(true);
    reset();
  });

  if (sent) {
    return (
      <div role="status" className="rounded-3xl border border-white/15 bg-white/5 p-8 text-white">
        <CircleCheckBig className="size-8 text-bond-yellow" aria-hidden />
        <p className="mt-4 font-heading text-xl font-semibold">Thanks for reaching out!</p>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          The contact form isn&apos;t connected yet, so your message wasn&apos;t sent. Until it is, please
          email us at {siteConfig.contact.email}.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-sm font-semibold text-bond-yellow hover:underline"
        >
          Write another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {(
        [
          { id: "name", label: "Name", type: "text", autoComplete: "name", placeholder: "Your name" },
          { id: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@example.com" },
        ] as const
      ).map((field) => (
        <div key={field.id} className="space-y-2">
          <label htmlFor={`contact-${field.id}`} className="block text-xs font-medium text-white/70">
            {field.label}
          </label>
          <input
            id={`contact-${field.id}`}
            type={field.type}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            aria-invalid={Boolean(errors[field.id]) || undefined}
            aria-describedby={errors[field.id] ? `contact-${field.id}-error` : undefined}
            className={darkInput(Boolean(errors[field.id]))}
            {...register(field.id)}
          />
          {errors[field.id] && (
            <p id={`contact-${field.id}-error`} className="text-xs text-red-300">
              {errors[field.id]?.message}
            </p>
          )}
        </div>
      ))}
      <div className="space-y-2">
        <label htmlFor="contact-message" className="block text-xs font-medium text-white/70">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={4}
          placeholder="Hello,"
          aria-invalid={Boolean(errors.message) || undefined}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={cn(darkInput(Boolean(errors.message)), "resize-y")}
          {...register("message")}
        />
        {errors.message && (
          <p id="contact-message-error" className="text-xs text-red-300">
            {errors.message.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-lg bg-bond-yellow text-sm font-bold text-bond-ink transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:bg-bond-gold hover:shadow-[0_12px_30px_-12px_rgba(247,204,21,0.7)] active:translate-y-0 active:scale-[0.99] disabled:opacity-60"
      >
        {isSubmitting ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
