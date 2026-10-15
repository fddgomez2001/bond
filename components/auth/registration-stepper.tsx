import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Step = { title: string; description?: string };

export const customerSteps: Step[] = [
  { title: "Personal Information", description: "Tell us about you" },
  { title: "Account Credentials", description: "Secure your account" },
  { title: "Email Verification", description: "Confirm it's you" },
];

export const vendorSteps: Step[] = [
  { title: "Personal Information", description: "Tell us about you" },
  { title: "Business Documents", description: "Selfie, ID and proof of business" },
  { title: "Account Credentials", description: "Secure your account" },
  { title: "Email Verification", description: "Confirm it's you" },
  { title: "Application Status", description: "Wait for document review" },
];

export const recoverySteps: Step[] = [
  { title: "Your Email", description: "Where we send the code" },
  { title: "Verification Code", description: "Prove it's your account" },
  { title: "New Password", description: "Choose a strong one" },
];

/**
 * Vertical list on large screens (inside the slate panel), compact
 * numbered row on small screens.
 */
export function RegistrationStepper({
  steps,
  current,
  label = "Registration progress",
}: {
  steps: Step[];
  current: number;
  label?: string;
}) {
  return (
    <nav aria-label={label}>
      <p className="mb-3 text-sm text-white/80 lg:hidden">
        Step {current + 1} of {steps.length}:{" "}
        <span className="font-semibold text-white">{steps[current]?.title}</span>
      </p>
      <ol className="flex items-center gap-2 lg:flex-col lg:items-stretch lg:gap-7">
        {steps.map((step, index) => {
          const state = index < current ? "done" : index === current ? "current" : "upcoming";
          return (
            <li
              key={step.title}
              aria-current={state === "current" ? "step" : undefined}
              className="flex items-center gap-4"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-colors lg:size-10",
                  state === "current" && "border-bond-yellow bg-bond-yellow text-bond-ink",
                  state === "done" && "border-white bg-white text-bond-slate",
                  state === "upcoming" && "border-white/50 text-white",
                )}
              >
                {state === "done" ? <Check className="size-4" aria-hidden /> : index + 1}
                <span className="sr-only">
                  {state === "done" ? " (completed)" : state === "current" ? " (current)" : ""}
                </span>
              </span>
              <span className="hidden lg:block">
                <span className="block text-[0.7rem] tracking-[0.15em] text-white/60 uppercase">
                  Step {index + 1}
                </span>
                <span className="block text-sm font-bold tracking-wide uppercase">{step.title}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
