import type { ReactNode } from "react";

/** Title block at the top of every admin / vendor page. */
export function WorkspaceHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-bond-ink/8 bg-gradient-to-br from-bond-yellow via-bond-yellow to-bond-yellow-soft">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-white/25 blur-3xl" />
      <div className="relative flex flex-col gap-4 px-4 py-7 sm:px-8 sm:py-9 lg:flex-row lg:items-end lg:justify-between lg:px-10">
        <div className="min-w-0">
          {eyebrow && <div className="mb-2 text-xs font-semibold tracking-wide text-bond-slate/75 uppercase">{eyebrow}</div>}
          <h1 className="font-display text-3xl leading-tight tracking-[-0.03em] text-bond-slate sm:text-[2.6rem]">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-[0.95rem] text-bond-slate/80">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </header>
  );
}

/** Standard padding for the content under the header. */
export function WorkspaceContent({ children }: { children: ReactNode }) {
  return <div className="flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-10">{children}</div>;
}
