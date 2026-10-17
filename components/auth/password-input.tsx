"use client";

import { useState, type ComponentProps } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { inputClasses } from "@/components/ui/field";
import { passwordRules } from "@/lib/validations/password";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<"input">, "type"> & { invalid?: boolean };

export function PasswordInput({ invalid, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        aria-invalid={invalid || undefined}
        className={inputClasses(invalid, cn("pr-12", className))}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-bond-ink/50 hover:text-bond-slate"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
      </button>
    </div>
  );
}

/** Live checklist of the password policy. */
export function PasswordRequirements({ password, id }: { password: string; id?: string }) {
  return (
    <ul id={id} className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2" aria-label="Password requirements">
      {passwordRules.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.id}
            className={cn("flex items-center gap-1.5", met ? "text-emerald-700" : "text-bond-ink/55")}
          >
            {met ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
            <span>
              {rule.label}
              <span className="sr-only">{met ? " (met)" : " (not met)"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
