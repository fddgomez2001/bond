import { ViewTransition } from "react";
import Form from "next/form";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, ChevronRight, CircleAlert, Search, Users } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Alert } from "@/components/ui/alert";
import type { DirectoryUser, RoleFilter, listUsers } from "@/lib/admin/users";
import { formatDateTime } from "@/lib/format";
import { cn, initials } from "@/lib/utils";
import { WorkspaceContent, WorkspaceHeader } from "@/components/workspace/page-header";
import { RoleBadge } from "./role-badge";

type Directory = Awaited<ReturnType<typeof listUsers>>;

const BASE = "/dashboard/admin/users";
const filterLabels: Record<RoleFilter, string> = { all: "All users", customer: "Customers", vendor: "Vendors", admin: "Admins" };

function hrefFor(params: { q?: string; role?: RoleFilter; page?: number }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.role && params.role !== "all") search.set("role", params.role);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

const fullName = (u: DirectoryUser) => [u.firstName, u.lastName].filter(Boolean).join(" ") || "No name";

export function UserDirectory({ query, role, data }: { query: string; role: RoleFilter; data: Directory }) {
  return (
    <main className="flex flex-1 flex-col">
      <WorkspaceHeader
        eyebrow="Admin · Users"
        title="User Management"
        description="Everyone with a BOND account. Search by name, email or phone, and filter by role."
      />

      <WorkspaceContent>
        {/* Search + role filter */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <nav aria-label="Filter by role" className="-mx-1 overflow-x-auto px-1 pb-1">
            <ul className="flex w-max gap-2">
              {(Object.keys(filterLabels) as RoleFilter[]).map((r) => (
                <li key={r}>
                  <Link
                    href={hrefFor({ q: query, role: r })}
                    scroll={false}
                    aria-current={r === role ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ease-smooth",
                      r === role
                        ? "border-bond-slate bg-bond-slate text-white shadow-[var(--shadow-card)]"
                        : "border-bond-ink/10 bg-white text-bond-ink/70 hover:border-bond-slate/30 hover:text-bond-ink",
                    )}
                  >
                    {filterLabels[r]}
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-xs",
                        r === role ? "bg-white/20 text-white" : "bg-bond-ink/5 text-bond-ink/60",
                      )}
                    >
                      {data.counts[r]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Form action={BASE} scroll={false} className="relative w-full xl:w-80" role="search">
            {role !== "all" && <input type="hidden" name="role" value={role} />}
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-bond-ink/40" aria-hidden />
            <label htmlFor="user-search" className="sr-only">
              Search users
            </label>
            <input
              id="user-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search name, email or phone"
              className="h-11 w-full rounded-xl border border-bond-ink/12 bg-white pr-4 pl-10 text-base shadow-sm transition-[border-color,box-shadow] duration-300 placeholder:text-bond-ink/40 focus:border-bond-slate focus:ring-4 focus:ring-bond-yellow/40 focus:outline-none sm:text-sm"
            />
          </Form>
        </div>

        {data.loadError && (
          <Alert tone="error" className="mt-6">
            Users couldn&apos;t be loaded. Check that the database migrations have been run.
          </Alert>
        )}
        {!data.emailsAvailable && (
          <Alert tone="warning" className="mt-6">
            Emails and sign-in times are hidden because SUPABASE_SERVICE_ROLE_KEY isn&apos;t set on the server.
          </Alert>
        )}

        <ViewTransition key={`${role}|${query}|${data.page}`} enter="list-in" exit="list-out" default="none">
          <section aria-label="Users" className="mt-6">
            {data.users.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-bond-ink/15 bg-white px-6 py-14 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-bond-yellow/40 text-bond-slate">
                  <Users className="size-7" aria-hidden />
                </span>
                <p className="text-bond-ink/65">
                  {query ? <>No users match &ldquo;{query}&rdquo;.</> : "No users in this group yet."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-3xl border border-bond-ink/8 bg-white shadow-[var(--shadow-card)] md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-bond-paper text-xs font-semibold tracking-wide text-bond-ink/55 uppercase">
                      <tr>
                        <th scope="col" className="px-5 py-3">User</th>
                        <th scope="col" className="px-3 py-3">Role</th>
                        <th scope="col" className="px-3 py-3">Status</th>
                        <th scope="col" className="hidden px-3 py-3 lg:table-cell">Joined</th>
                        <th scope="col" className="hidden px-3 py-3 xl:table-cell">Last sign-in</th>
                        <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-bond-ink/8">
                      {data.users.map((user) => (
                        <tr key={user.id} className="transition-colors duration-300 hover:bg-bond-paper/70">
                          <td className="px-5 py-3.5">
                            <span className="flex items-center gap-3">
                              <Avatar user={user} />
                              <span className="min-w-0">
                                <span className="block max-w-[14rem] truncate font-semibold text-bond-ink">{fullName(user)}</span>
                                <span className="block max-w-[14rem] truncate text-xs text-bond-ink/55">{user.email ?? "—"}</span>
                              </span>
                            </span>
                          </td>
                          <td className="px-3 py-3.5"><RoleBadge role={user.role} /></td>
                          <td className="px-3 py-3.5"><UserStatus user={user} /></td>
                          <td className="hidden px-3 py-3.5 text-bond-ink/70 lg:table-cell">{formatDateTime(user.joinedAt)}</td>
                          <td className="hidden px-3 py-3.5 text-bond-ink/70 xl:table-cell">
                            {user.lastSignInAt ? formatDateTime(user.lastSignInAt) : "Never"}
                          </td>
                          <td className="px-5 py-3.5 text-right"><UserAction user={user} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Phone cards */}
                <ul className="space-y-3 md:hidden">
                  {data.users.map((user) => (
                    <li key={user.id} className="rounded-3xl border border-bond-ink/8 bg-white p-4 shadow-[var(--shadow-card)]">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-bond-ink">{fullName(user)}</p>
                          <p className="truncate text-xs text-bond-ink/55">{user.email ?? "—"}</p>
                        </div>
                        <RoleBadge role={user.role} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-bond-ink/60">
                        <UserStatus user={user} />
                        <span>Joined {formatDateTime(user.joinedAt)}</span>
                      </div>
                      {user.vendorApplicationId && (
                        <div className="mt-3 border-t border-bond-ink/8 pt-3">
                          <UserAction user={user} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </ViewTransition>

        {/* Pagination */}
        {data.pageCount > 1 && (
          <nav aria-label="Pages" className="mt-6 flex items-center justify-between gap-3 text-sm">
            <span className="text-bond-ink/55">
              Page {data.page} of {data.pageCount} · {data.total} users
            </span>
            <span className="flex gap-2">
              <PageLink direction="previous" disabled={data.page <= 1} href={hrefFor({ q: query, role, page: data.page - 1 })} />
              <PageLink direction="next" disabled={data.page >= data.pageCount} href={hrefFor({ q: query, role, page: data.page + 1 })} />
            </span>
          </nav>
        )}
      </WorkspaceContent>
    </main>
  );
}

function Avatar({ user }: { user: DirectoryUser }) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
        user.role === "admin" ? "bg-bond-ink text-white" : user.role === "vendor" ? "bg-bond-slate text-white" : "bg-bond-yellow/60 text-bond-slate",
      )}
    >
      {initials(user.firstName, user.lastName)}
    </span>
  );
}

function UserStatus({ user }: { user: DirectoryUser }) {
  if (user.role === "vendor" && user.vendorStatus) return <StatusBadge status={user.vendorStatus} />;
  return user.emailConfirmed ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
      <BadgeCheck className="size-3.5" aria-hidden /> Email verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
      <CircleAlert className="size-3.5" aria-hidden /> Not verified
    </span>
  );
}

function UserAction({ user }: { user: DirectoryUser }) {
  if (!user.vendorApplicationId) return null;
  return (
    <Link
      href={`/dashboard/admin/vendors/${user.vendorApplicationId}`}
      transitionTypes={["nav-forward"]}
      className="inline-flex items-center gap-1 rounded-xl bg-bond-yellow px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-bond-ink transition-colors duration-300 hover:bg-bond-gold"
    >
      View application
    </Link>
  );
}

function PageLink({ href, disabled, direction }: { href: string; disabled: boolean; direction: "previous" | "next" }) {
  const content =
    direction === "previous" ? (
      <>
        <ChevronLeft className="size-4" aria-hidden /> Previous
      </>
    ) : (
      <>
        Next <ChevronRight className="size-4" aria-hidden />
      </>
    );
  const classes = "inline-flex items-center gap-1 rounded-xl border px-3 py-2 font-semibold transition-colors duration-300";
  if (disabled) return <span className={cn(classes, "cursor-not-allowed border-bond-ink/8 text-bond-ink/30")}>{content}</span>;
  return (
    <Link href={href} scroll={false} className={cn(classes, "border-bond-ink/12 bg-white text-bond-ink hover:border-bond-slate/40")}>
      {content}
    </Link>
  );
}
