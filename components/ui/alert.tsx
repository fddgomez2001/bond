import type { ReactNode } from "react";
import { CircleAlert, CircleCheckBig, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "error";

const tones: Record<Tone, { box: string; icon: typeof Info }> = {
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", icon: Info },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: CircleCheckBig },
  warning: { box: "border-amber-300 bg-amber-50 text-amber-950", icon: TriangleAlert },
  error: { box: "border-red-200 bg-red-50 text-red-900", icon: CircleAlert },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { box, icon: Icon } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed", box, className)}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}

/** Form-level error banner. Renders nothing when there is no message. */
export function ErrorMessage({ message, className }: { message?: string; className?: string }) {
  if (!message) return null;
  return (
    <Alert tone="error" className={className}>
      {message}
    </Alert>
  );
}
