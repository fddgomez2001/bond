-- =====================================================================
-- BOND Phase 1 — profiles, vendor applications, identity documents
-- Safe to run more than once.
--
-- Security model
--   * Passwords live only in Supabase Auth (auth.users). Never here.
--   * A trigger creates the profile in the same transaction as the auth
--     user, so an account never exists without its profile. Accounts that
--     already existed when this runs are backfilled.
--   * The role is decided by that trigger. Sign-up metadata can only ask
--     for 'customer' or 'vendor'; 'admin' is granted manually in SQL.
--   * Column-level grants + RLS: users read their own rows and may edit a
--     few profile fields. Nobody but the service role or an admin can
--     change roles, document paths or review status.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  first_name     text check (first_name is null or char_length(first_name) between 1 and 50),
  last_name      text check (last_name is null or char_length(last_name) between 1 and 50),
  birthdate      date check (birthdate is null or birthdate > date '1900-01-01'),
  contact_number text check (contact_number is null or contact_number ~ '^\+?[0-9 ()-]{7,20}$'),
  role           text not null default 'customer'
                 check (role in ('customer', 'vendor', 'admin')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.profiles is 'Application data for each auth user. Role is server-assigned.';

create index if not exists profiles_role_idx on public.profiles (role);

create table if not exists public.vendor_profiles (
  id                           uuid primary key default gen_random_uuid(),
  user_id                      uuid not null unique references public.profiles (id) on delete cascade,
  business_verification_status text not null default 'pending_review'
                               check (business_verification_status in
                                      ('pending_review', 'approved', 'rejected', 'needs_resubmission')),
  selfie_path                  text,
  government_id_path           text,
  proof_of_business_path       text,
  submitted_at                 timestamptz,
  reviewed_at                  timestamptz,
  reviewed_by                  uuid references public.profiles (id) on delete set null,
  review_notes                 text check (review_notes is null or char_length(review_notes) <= 2000),
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now()
);

comment on table public.vendor_profiles is 'Vendor application and document review state.';

create index if not exists vendor_profiles_status_idx
  on public.vendor_profiles (business_verification_status);

-- Optional customer ID uploads (off by default — see lib/config/features.ts).
-- Kept apart from profiles so verification status is tracked separately
-- from email verification.
create table if not exists public.identity_documents (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  document_type       text not null check (document_type in ('government_id')),
  storage_path        text not null unique,
  verification_status text not null default 'pending_review'
                      check (verification_status in
                             ('pending_review', 'approved', 'rejected', 'needs_resubmission')),
  reviewed_at         timestamptz,
  reviewed_by         uuid references public.profiles (id) on delete set null,
  review_notes        text check (review_notes is null or char_length(review_notes) <= 2000),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists identity_documents_user_id_idx on public.identity_documents (user_id);

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists vendor_profiles_set_updated_at on public.vendor_profiles;
create trigger vendor_profiles_set_updated_at
  before update on public.vendor_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists identity_documents_set_updated_at on public.identity_documents;
create trigger identity_documents_set_updated_at
  before update on public.identity_documents
  for each row execute function public.set_updated_at();

-- True when the caller is a BOND admin. SECURITY DEFINER so it can read
-- profiles without tripping the RLS policies that call it.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------
-- Create the profile when an auth user is created
-- ---------------------------------------------------------------------

-- Builds a profile from sign-up metadata. Shared by the trigger and the
-- backfill below; idempotent, so running it twice for a user is harmless.
create or replace function public.create_profile_for_user(p_user_id uuid, p_meta jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(p_meta, '{}'::jsonb);
  assigned_role text;
  parsed_birthdate date;
  phone text := nullif(trim(meta ->> 'contact_number'), '');
begin
  -- Only the two self-service account types can be requested. Anything
  -- else (including 'admin') becomes a customer.
  assigned_role := case when meta ->> 'account_type' = 'vendor' then 'vendor' else 'customer' end;

  begin
    parsed_birthdate := (meta ->> 'birthdate')::date;
  exception when others then
    parsed_birthdate := null;
  end;
  if parsed_birthdate is not null and parsed_birthdate <= date '1900-01-01' then
    parsed_birthdate := null;
  end if;

  if phone is not null and phone !~ '^\+?[0-9 ()-]{7,20}$' then
    phone := null;
  end if;

  insert into public.profiles (id, first_name, last_name, birthdate, contact_number, role)
  values (
    p_user_id,
    left(nullif(trim(meta ->> 'first_name'), ''), 50),
    left(nullif(trim(meta ->> 'last_name'), ''), 50),
    parsed_birthdate,
    phone,
    assigned_role
  )
  on conflict (id) do nothing;

  if assigned_role = 'vendor' then
    insert into public.vendor_profiles (user_id) values (p_user_id)
    on conflict (user_id) do nothing;
  end if;
end;
$$;

-- Never callable through the API — only by the trigger and this script.
revoke execute on function public.create_profile_for_user(uuid, jsonb) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.create_profile_for_user(new.id, new.raw_user_meta_data);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: accounts created before this migration ran get a profile too.
do $$
declare
  u record;
begin
  for u in
    select au.id, au.raw_user_meta_data
    from auth.users au
    where not exists (select 1 from public.profiles p where p.id = au.id)
  loop
    perform public.create_profile_for_user(u.id, u.raw_user_meta_data);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Privileges (column level) — RLS policies below narrow them to rows
-- ---------------------------------------------------------------------

revoke all on public.profiles, public.vendor_profiles, public.identity_documents from anon, authenticated;
grant all on public.profiles, public.vendor_profiles, public.identity_documents to service_role;

grant select on public.profiles to authenticated;
-- Users may edit only these. role and birthdate are deliberately absent.
grant update (first_name, last_name, contact_number) on public.profiles to authenticated;

grant select on public.vendor_profiles to authenticated;
-- Only review columns, and the RLS policy limits updates to admins.
grant update (business_verification_status, reviewed_at, reviewed_by, review_notes)
  on public.vendor_profiles to authenticated;

grant select on public.identity_documents to authenticated;
grant update (verification_status, reviewed_at, reviewed_by, review_notes)
  on public.identity_documents to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.vendor_profiles enable row level security;
alter table public.identity_documents enable row level security;

-- profiles
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- vendor_profiles
drop policy if exists "Vendors can view their own application" on public.vendor_profiles;
create policy "Vendors can view their own application"
  on public.vendor_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can view vendor applications" on public.vendor_profiles;
create policy "Admins can view vendor applications"
  on public.vendor_profiles for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can review vendor applications" on public.vendor_profiles;
create policy "Admins can review vendor applications"
  on public.vendor_profiles for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- identity_documents
drop policy if exists "Users can view their own identity documents" on public.identity_documents;
create policy "Users can view their own identity documents"
  on public.identity_documents for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Admins can view identity documents" on public.identity_documents;
create policy "Admins can view identity documents"
  on public.identity_documents for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can review identity documents" on public.identity_documents;
create policy "Admins can review identity documents"
  on public.identity_documents for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- No INSERT or DELETE policies: rows are created by the trigger and the
-- trusted server (service role), and removed when the auth user is deleted.
