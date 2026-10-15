"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending || undefined} className={className}>
      {pending ? <Spinner className="size-4" /> : <LogOut className="size-4" aria-hidden />}
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}

/** Log-out form with a pending state; the toast confirms it on the next page. */
export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <SubmitButton
        className={cn(
          "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-70",
          className,
        )}
      />
    </form>
  );
}
