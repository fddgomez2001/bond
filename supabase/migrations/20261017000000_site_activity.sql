-- =====================================================================
-- BOND — site activity for the admin "Site Visitors" page
-- Page visits (device, browser, approximate location) and sign-in
-- attempts. Written only by the server (service role); only admins can
-- read them. No raw IP addresses are stored. Rows older than 90 days are
-- pruned by public.prune_site_activity(), which the server calls now
-- and then.
-- Run after 20261016000000_marketplace.sql. Safe to re-run.
-- =====================================================================

create table if not exists public.site_visits (
  id            bigint generated always as identity primary key,
  visitor_id    uuid not null,
  user_id       uuid references public.profiles (id) on delete set null,
  host          text check (host is null or char_length(host) <= 120),
  path          text not null check (char_length(path) between 1 and 300),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 120),
  device_type   text not null default 'unknown'
                check (device_type in ('phone', 'tablet', 'desktop', 'unknown')),
  device_model  text check (device_model is null or char_length(device_model) <= 80),
  os            text check (os is null or char_length(os) <= 40),
  browser       text check (browser is null or char_length(browser) <= 40),
  country       text check (country is null or char_length(country) <= 80),
  city          text check (city is null or char_length(city) <= 80),
  created_at    timestamptz not null default now()
);

create index if not exists site_visits_created_idx on public.site_visits (created_at desc);
create index if not exists site_visits_visitor_idx on public.site_visits (visitor_id, created_at desc);

create table if not exists public.sign_in_attempts (
  id           bigint generated always as identity primary key,
  email        text not null check (char_length(email) between 3 and 254),
  succeeded    boolean not null,
  reason       text check (reason is null or reason in ('wrong_password', 'email_not_verified', 'too_many_attempts', 'error')),
  user_id      uuid references public.profiles (id) on delete set null,
  visitor_id   uuid,
  host         text check (host is null or char_length(host) <= 120),
  device_type  text not null default 'unknown'
               check (device_type in ('phone', 'tablet', 'desktop', 'unknown')),
  device_model text check (device_model is null or char_length(device_model) <= 80),
  os           text check (os is null or char_length(os) <= 40),
  browser      text check (browser is null or char_length(browser) <= 40),
  country      text check (country is null or char_length(country) <= 80),
  city         text check (city is null or char_length(city) <= 80),
  created_at   timestamptz not null default now()
);

create index if not exists sign_in_attempts_created_idx on public.sign_in_attempts (created_at desc);

-- Keep 90 days of history.
create or replace function public.prune_site_activity()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.site_visits where created_at < now() - interval '90 days';
  delete from public.sign_in_attempts where created_at < now() - interval '90 days';
$$;

revoke execute on function public.prune_site_activity() from public, anon, authenticated;
grant execute on function public.prune_site_activity() to service_role;

-- Privileges: the server (service role) writes; admins read.
revoke all on public.site_visits, public.sign_in_attempts from anon, authenticated;
grant all on public.site_visits, public.sign_in_attempts to service_role;
grant select on public.site_visits, public.sign_in_attempts to authenticated;

alter table public.site_visits enable row level security;
alter table public.sign_in_attempts enable row level security;

drop policy if exists "Admins can read site visits" on public.site_visits;
create policy "Admins can read site visits"
  on public.site_visits for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can read sign-in attempts" on public.sign_in_attempts;
create policy "Admins can read sign-in attempts"
  on public.sign_in_attempts for select to authenticated
  using ((select public.is_admin()));
