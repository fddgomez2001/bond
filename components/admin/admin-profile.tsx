import type { ReactNode } from "react";
import { BadgeCheck, CalendarClock, KeyRound, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import type { AuthDetails } from "@/lib/admin/auth-users";
import { formatDateOnly, formatDateTime } from "@/lib/format";
import { initials } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { RoleBadge } from "./role-badge";

export function AdminProfile({
  profile,
  email,
  details,
}: {
  profile: Profile;
  email: string | null;
  details: AuthDetails | null;
}) {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Admin";

  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader eyebrow="Admin · Account" title="Your profile" description="The account you use to manage BOND." />

      <WorkspaceContent>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Reveal className="xl:col-span-2">
            <section className="rounded-3xl border border-bond-ink/8 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <span className="relative flex size-20 shrink-0 items-center justify-center rounded-full border-[3px] border-bond-gold bg-bond-slate font-display text-3xl font-semibold text-white shadow-[var(--shadow-avatar)]">
                  {initials(profile.first_name, profile.last_name)}
                  <span className="absolute right-0.5 bottom-0.5 size-4 rounded-full border-[3px] border-white bg-emerald-500" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-heading text-2xl font-bold text-bond-ink">{name}</h2>
                  <p className="truncate text-bond-ink/60">{email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <RoleBadge role={profile.role} />
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500" /> Signed in
                    </span>
                  </div>
                </div>
              </div>

              <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-5 border-t border-bond-ink/8 pt-6 sm:grid-cols-2">
                <Detail icon={<UserRound className="size-4" />} label="Full name">{name}</Detail>
                <Detail icon={<Mail className="size-4" />} label="Email address">
                  <span className="break-all">{email ?? "—"}</span>
                  {details?.emailConfirmed && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <BadgeCheck className="size-3.5" aria-hidden /> Verified
                    </span>
                  )}
                </Detail>
                <Detail icon={<Phone className="size-4" />} label="Contact number">{profile.contact_number ?? "Not provided"}</Detail>
                <Detail icon={<CalendarClock className="size-4" />} label="Member since">{formatDateOnly(profile.created_at.slice(0, 10))}</Detail>
                <Detail icon={<KeyRound className="size-4" />} label="Last sign-in">
                  {details?.lastSignInAt ? formatDateTime(details.lastSignInAt) : "—"}
                </Detail>
                <Detail icon={<ShieldCheck className="size-4" />} label="Access level">Full admin — vendor reviews and user directory</Detail>
              </dl>
            </section>
          </Reveal>

          <Reveal delay={100}>
            <section className="h-full rounded-3xl bg-bond-slate p-6 text-white shadow-[var(--shadow-card)] sm:p-8">
              <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
                <ShieldCheck className="size-5 text-bond-yellow" aria-hidden />
                Keep this account safe
              </h2>
              <ul className="mt-5 space-y-4 text-sm text-white/80">
                <li>Use a long, unique password and don&apos;t share it — admins can see every vendor&apos;s documents.</li>
                <li>Log out when you finish on a shared or public computer.</li>
                <li>
                  To change this account&apos;s password, use the Supabase dashboard (Authentication → Users) until
                  password reset is switched on.
                </li>
              </ul>
            </section>
          </Reveal>
        </div>
      </WorkspaceContent>
    </main>
  );
}

function Detail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-bond-yellow/40 text-bond-slate" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold tracking-wide text-bond-ink/50 uppercase">{label}</dt>
        <dd className="mt-0.5 text-[0.95rem] text-bond-ink">{children}</dd>
      </div>
    </div>
  );
}
