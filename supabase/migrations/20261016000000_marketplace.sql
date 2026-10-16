-- =====================================================================
-- BOND Phase 2 — marketplace
-- Shops, listings (gifts, surprises, event services), cart, orders,
-- event bookings, reviews and problem reports.
-- Run after 20261015000000 and 20261015000100. Safe to re-run.
--
-- Security model
--   * Anyone can browse open shops of APPROVED vendors and their
--     APPROVED listings. Everything else is private.
--   * Vendors manage only their own shop/listings. New or edited
--     listings always go back to "pending_review" (trigger) — only an
--     admin can approve.
--   * Orders are never written directly by users. Every step (placing,
--     paying, preparing, delivering, confirming, reporting, refunding)
--     goes through a SECURITY DEFINER function that checks who is asking
--     and only allows the next valid step. Prices are always read from
--     the database, never from the browser.
--   * Payment confirmation can only be called by the server (service
--     role) — today by the test-mode checkout, later by a payment
--     provider's webhook.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.shops (
  id             uuid primary key default gen_random_uuid(),
  vendor_id      uuid not null unique references public.profiles (id) on delete cascade,
  slug           text not null unique
                 check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  name           text not null check (char_length(name) between 2 and 80),
  owner_name     text,
  tagline        text check (tagline is null or char_length(tagline) <= 120),
  description    text check (description is null or char_length(description) <= 2000),
  city           text check (city is null or char_length(city) <= 80),
  contact_number text check (contact_number is null or contact_number ~ '^\+?[0-9 ()-]{7,20}$'),
  delivery_fee   numeric(10, 2) not null default 0 check (delivery_fee between 0 and 100000),
  offers         text[] not null default '{}'
                 check (offers <@ array['gift', 'surprise', 'service']::text[]),
  logo_path      text,
  is_open        boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.listings (
  id               uuid primary key default gen_random_uuid(),
  shop_id          uuid not null references public.shops (id) on delete cascade,
  kind             text not null check (kind in ('gift', 'surprise', 'service')),
  service_category text check (service_category in (
                     'package', 'venue', 'catering', 'photo_video', 'decorations',
                     'host', 'sound_lights', 'cake_desserts', 'flowers', 'entertainment')),
  event_types      text[] not null default '{}'
                   check (event_types <@ array['corporate', 'social', 'cultural']::text[]),
  title            text not null check (char_length(title) between 3 and 100),
  description      text not null check (char_length(description) between 10 and 2000),
  price            numeric(12, 2) not null check (price between 0 and 10000000),
  inclusions       text[] not null default '{}' check (cardinality(inclusions) <= 20),
  image_path       text,
  status           text not null default 'pending_review'
                   check (status in ('pending_review', 'approved', 'rejected')),
  review_notes     text check (review_notes is null or char_length(review_notes) <= 2000),
  reviewed_at      timestamptz,
  reviewed_by      uuid references public.profiles (id) on delete set null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Services always have a category; gifts and surprises never do.
  constraint listings_service_category check ((kind = 'service') = (service_category is not null))
);

create index if not exists listings_shop_idx on public.listings (shop_id);
create index if not exists listings_public_idx on public.listings (status, kind) where is_active;

create table if not exists public.cart_items (
  customer_id uuid not null references public.profiles (id) on delete cascade,
  listing_id  uuid not null references public.listings (id) on delete cascade,
  quantity    integer not null default 1 check (quantity between 1 and 99),
  added_at    timestamptz not null default now(),
  primary key (customer_id, listing_id)
);

create sequence if not exists public.order_number_seq start 1001;
create sequence if not exists public.booking_number_seq start 1001;

create table if not exists public.event_bookings (
  id                 uuid primary key default gen_random_uuid(),
  booking_number     text not null unique
                     default ('EVT-' || lpad(nextval('public.booking_number_seq')::text, 6, '0')),
  customer_id        uuid not null references public.profiles (id) on delete cascade,
  event_type         text not null check (event_type in ('corporate', 'social', 'cultural')),
  mode               text not null check (mode in ('package', 'custom')),
  event_at           timestamptz not null,
  place              text not null check (char_length(place) between 3 and 200),
  guest_count        integer check (guest_count is null or guest_count between 1 and 100000),
  notes              text check (notes is null or char_length(notes) <= 1000),
  appointment_status text not null default 'none' check (appointment_status in ('none', 'requested', 'skipped')),
  appointment_at     timestamptz,
  appointment_note   text check (appointment_note is null or char_length(appointment_note) <= 500),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists event_bookings_customer_idx on public.event_bookings (customer_id, created_at desc);

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text not null unique
                    default ('BND-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  customer_id       uuid not null references public.profiles (id) on delete cascade,
  shop_id           uuid not null references public.shops (id) on delete restrict,
  booking_id        uuid references public.event_bookings (id) on delete cascade,
  kind              text not null check (kind in ('gift', 'surprise', 'service')),
  status            text not null default 'awaiting_payment' check (status in (
                      'awaiting_payment', 'paid', 'confirmed', 'preparing', 'ready',
                      'delivery_failed', 'delivered', 'completed', 'cancelled', 'disputed')),
  payment_status    text not null default 'unpaid' check (payment_status in ('unpaid', 'held', 'released', 'refunded')),
  payment_method    text check (payment_method is null or char_length(payment_method) <= 40),
  payment_reference text check (payment_reference is null or char_length(payment_reference) <= 80),
  paid_at           timestamptz,
  subtotal          numeric(12, 2) not null check (subtotal >= 0),
  delivery_fee      numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  total             numeric(12, 2) not null check (total >= 0),
  customer_name     text,
  customer_phone    text,
  recipient_name    text check (recipient_name is null or char_length(recipient_name) between 2 and 100),
  recipient_phone   text check (recipient_phone is null or recipient_phone ~ '^\+?[0-9 ()-]{7,20}$'),
  delivery_address  text check (delivery_address is null or char_length(delivery_address) between 5 and 300),
  delivery_notes    text check (delivery_notes is null or char_length(delivery_notes) <= 500),
  gift_message      text check (gift_message is null or char_length(gift_message) <= 500),
  scheduled_for     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint orders_booking_kind check ((booking_id is not null) = (kind = 'service'))
);

create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);
create index if not exists orders_shop_idx on public.orders (shop_id, status);
create index if not exists orders_booking_idx on public.orders (booking_id);

create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  title      text not null,
  kind       text not null,
  service_category text,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity   integer not null check (quantity between 1 and 99),
  line_total numeric(12, 2) not null check (line_total >= 0),
  image_path text
);

create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.order_events (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders (id) on delete cascade,
  status     text not null,
  message    text not null,
  actor_role text not null check (actor_role in ('customer', 'vendor', 'admin', 'system')),
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null unique references public.orders (id) on delete cascade,
  shop_id       uuid not null references public.shops (id) on delete cascade,
  customer_id   uuid not null references public.profiles (id) on delete cascade,
  reviewer_name text not null,
  rating        integer not null check (rating between 1 and 5),
  comment       text check (comment is null or char_length(comment) <= 1000),
  created_at    timestamptz not null default now()
);

create index if not exists reviews_shop_idx on public.reviews (shop_id, created_at desc);

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  reason      text not null check (reason in (
                'not_delivered', 'damaged', 'wrong_item', 'late', 'service_issue', 'other')),
  details     text not null check (char_length(details) between 10 and 1000),
  status      text not null default 'open' check (status in ('open', 'resolved')),
  resolution  text check (resolution is null or resolution in ('refund', 'release')),
  admin_note  text check (admin_note is null or char_length(admin_note) <= 1000),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists reports_status_idx on public.reports (status, created_at);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['shops', 'listings', 'event_bookings', 'orders'] loop
    execute format('drop trigger if exists %1$s_set_updated_at on public.%1$s', t);
    execute format(
      'create trigger %1$s_set_updated_at before update on public.%1$s
       for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------

create or replace function public.is_approved_vendor(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.vendor_profiles
    where user_id = p_user and business_verification_status = 'approved'
  );
$$;

create or replace function public.owns_shop(p_shop uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.shops where id = p_shop and vendor_id = (select auth.uid()));
$$;

revoke execute on function public.is_approved_vendor(uuid) from public;
revoke execute on function public.owns_shop(uuid) from public, anon;
grant execute on function public.is_approved_vendor(uuid) to anon, authenticated;
grant execute on function public.owns_shop(uuid) to authenticated;

-- The shop shows its owner's name; copy it from the profile.
create or replace function public.shops_set_owner_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '')
    into new.owner_name
    from public.profiles where id = new.vendor_id;
  return new;
end;
$$;

revoke execute on function public.shops_set_owner_name() from public, anon, authenticated;

drop trigger if exists shops_owner_name on public.shops;
create trigger shops_owner_name
  before insert or update of vendor_id on public.shops
  for each row execute function public.shops_set_owner_name();

-- Listings: only admins decide the review status. Any vendor edit to the
-- content sends the listing back to review.
create or replace function public.listings_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'pending_review';
    new.review_notes := null;
    new.reviewed_at := null;
    new.reviewed_by := null;
    return new;
  end if;

  new.shop_id := old.shop_id;
  new.status := old.status;
  new.review_notes := old.review_notes;
  new.reviewed_at := old.reviewed_at;
  new.reviewed_by := old.reviewed_by;

  if (new.kind, new.service_category, new.event_types, new.title, new.description,
      new.price, new.inclusions, new.image_path)
     is distinct from
     (old.kind, old.service_category, old.event_types, old.title, old.description,
      old.price, old.inclusions, old.image_path) then
    new.status := 'pending_review';
    new.review_notes := null;
  end if;
  return new;
end;
$$;

revoke execute on function public.listings_guard() from public, anon, authenticated;

drop trigger if exists listings_guard on public.listings;
create trigger listings_guard
  before insert or update on public.listings
  for each row execute function public.listings_guard();

create or replace function public.log_order_event(p_order uuid, p_status text, p_message text, p_actor text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.order_events (order_id, status, message, actor_role)
  values (p_order, p_status, p_message, p_actor);
$$;

revoke execute on function public.log_order_event(uuid, text, text, text) from public, anon, authenticated;

-- Returns the caller's profile if they are a customer, otherwise errors.
create or replace function public.require_customer()
returns public.profiles
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id = (select auth.uid());
  if v_profile.id is null or v_profile.role <> 'customer' then
    raise exception 'Only customer accounts can do this.' using errcode = '42501';
  end if;
  return v_profile;
end;
$$;

revoke execute on function public.require_customer() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Customer: placing orders
-- ---------------------------------------------------------------------

create or replace function public.place_gift_order(
  p_shop_id uuid,
  p_recipient_name text,
  p_recipient_phone text,
  p_address text,
  p_notes text default null,
  p_gift_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer public.profiles := public.require_customer();
  v_shop public.shops;
  v_order uuid;
  v_subtotal numeric(12, 2);
begin
  select * into v_shop from public.shops where id = p_shop_id;
  if v_shop.id is null or not v_shop.is_open or not public.is_approved_vendor(v_shop.vendor_id) then
    raise exception 'This shop isn''t accepting orders right now.';
  end if;

  if not exists (
    select 1 from public.cart_items c
    join public.listings l on l.id = c.listing_id
    where c.customer_id = v_customer.id and l.shop_id = p_shop_id
      and l.kind = 'gift' and l.status = 'approved' and l.is_active
  ) then
    raise exception 'Your cart for this shop is empty.';
  end if;

  select sum(l.price * c.quantity) into v_subtotal
  from public.cart_items c
  join public.listings l on l.id = c.listing_id
  where c.customer_id = v_customer.id and l.shop_id = p_shop_id
    and l.kind = 'gift' and l.status = 'approved' and l.is_active;

  insert into public.orders (
    customer_id, shop_id, kind, subtotal, delivery_fee, total, customer_name, customer_phone,
    recipient_name, recipient_phone, delivery_address, delivery_notes, gift_message)
  values (
    v_customer.id, p_shop_id, 'gift', v_subtotal, v_shop.delivery_fee, v_subtotal + v_shop.delivery_fee,
    trim(coalesce(v_customer.first_name, '') || ' ' || coalesce(v_customer.last_name, '')), v_customer.contact_number,
    trim(p_recipient_name), trim(p_recipient_phone), trim(p_address),
    nullif(trim(coalesce(p_notes, '')), ''), nullif(trim(coalesce(p_gift_message, '')), ''))
  returning id into v_order;

  insert into public.order_items (order_id, listing_id, title, kind, unit_price, quantity, line_total, image_path)
  select v_order, l.id, l.title, l.kind, l.price, c.quantity, l.price * c.quantity, l.image_path
  from public.cart_items c
  join public.listings l on l.id = c.listing_id
  where c.customer_id = v_customer.id and l.shop_id = p_shop_id
    and l.kind = 'gift' and l.status = 'approved' and l.is_active;

  delete from public.cart_items c
  using public.listings l
  where c.listing_id = l.id and c.customer_id = v_customer.id and l.shop_id = p_shop_id;

  perform public.log_order_event(v_order, 'awaiting_payment', 'Order placed. Waiting for payment.', 'customer');
  return v_order;
end;
$$;

create or replace function public.place_surprise_order(
  p_listing_id uuid,
  p_scheduled_for timestamptz,
  p_recipient_name text,
  p_recipient_phone text,
  p_address text,
  p_gift_message text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer public.profiles := public.require_customer();
  v_listing public.listings;
  v_shop public.shops;
  v_order uuid;
begin
  select * into v_listing from public.listings
  where id = p_listing_id and kind = 'surprise' and status = 'approved' and is_active;
  if v_listing.id is null then
    raise exception 'This surprise isn''t available.';
  end if;

  select * into v_shop from public.shops where id = v_listing.shop_id;
  if not v_shop.is_open or not public.is_approved_vendor(v_shop.vendor_id) then
    raise exception 'This shop isn''t accepting orders right now.';
  end if;

  if p_scheduled_for < now() + interval '3 hours' or p_scheduled_for > now() + interval '1 year' then
    raise exception 'Choose a date and time at least 3 hours from now.';
  end if;

  insert into public.orders (
    customer_id, shop_id, kind, subtotal, delivery_fee, total, customer_name, customer_phone,
    recipient_name, recipient_phone, delivery_address, delivery_notes, gift_message, scheduled_for)
  values (
    v_customer.id, v_shop.id, 'surprise', v_listing.price, v_shop.delivery_fee, v_listing.price + v_shop.delivery_fee,
    trim(coalesce(v_customer.first_name, '') || ' ' || coalesce(v_customer.last_name, '')), v_customer.contact_number,
    trim(p_recipient_name), trim(p_recipient_phone), trim(p_address),
    nullif(trim(coalesce(p_notes, '')), ''), nullif(trim(coalesce(p_gift_message, '')), ''), p_scheduled_for)
  returning id into v_order;

  insert into public.order_items (order_id, listing_id, title, kind, unit_price, quantity, line_total, image_path)
  values (v_order, v_listing.id, v_listing.title, 'surprise', v_listing.price, 1, v_listing.price, v_listing.image_path);

  perform public.log_order_event(v_order, 'awaiting_payment', 'Surprise booked. Waiting for payment.', 'customer');
  return v_order;
end;
$$;

create or replace function public.place_event_booking(
  p_event_type text,
  p_mode text,
  p_event_at timestamptz,
  p_place text,
  p_guest_count integer,
  p_notes text,
  p_listing_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer public.profiles := public.require_customer();
  v_ids uuid[];
  v_valid integer;
  v_packages integer;
  v_booking uuid;
  v_order uuid;
  v_shop record;
begin
  select array_agg(distinct x) into v_ids from unnest(p_listing_ids) as x;
  if v_ids is null or cardinality(v_ids) = 0 or cardinality(v_ids) > 15 then
    raise exception 'Choose between 1 and 15 services.';
  end if;
  if p_event_at < now() + interval '1 day' or p_event_at > now() + interval '2 years' then
    raise exception 'Choose an event date at least 1 day from now.';
  end if;

  select count(*), count(*) filter (where l.service_category = 'package')
    into v_valid, v_packages
  from public.listings l
  join public.shops s on s.id = l.shop_id
  where l.id = any (v_ids) and l.kind = 'service' and l.status = 'approved' and l.is_active
    and s.is_open and public.is_approved_vendor(s.vendor_id)
    and (cardinality(l.event_types) = 0 or p_event_type = any (l.event_types));

  if v_valid <> cardinality(v_ids) then
    raise exception 'Some of the services you chose are no longer available for this event.';
  end if;
  if p_mode = 'package' and (cardinality(v_ids) <> 1 or v_packages <> 1) then
    raise exception 'Choose exactly one package.';
  end if;
  if p_mode = 'custom' and v_packages > 0 then
    raise exception 'Packages can''t be mixed into a customized event.';
  end if;

  insert into public.event_bookings (customer_id, event_type, mode, event_at, place, guest_count, notes)
  values (v_customer.id, p_event_type, p_mode, p_event_at, trim(p_place), p_guest_count,
          nullif(trim(coalesce(p_notes, '')), ''))
  returning id into v_booking;

  -- One order per shop, so each vendor sees and handles only their part.
  for v_shop in
    select l.shop_id, sum(l.price) as subtotal
    from public.listings l where l.id = any (v_ids)
    group by l.shop_id
  loop
    insert into public.orders (
      customer_id, shop_id, booking_id, kind, subtotal, delivery_fee, total,
      customer_name, customer_phone, delivery_address, delivery_notes, scheduled_for)
    values (
      v_customer.id, v_shop.shop_id, v_booking, 'service', v_shop.subtotal, 0, v_shop.subtotal,
      trim(coalesce(v_customer.first_name, '') || ' ' || coalesce(v_customer.last_name, '')), v_customer.contact_number,
      trim(p_place), nullif(trim(coalesce(p_notes, '')), ''), p_event_at)
    returning id into v_order;

    insert into public.order_items (order_id, listing_id, title, kind, service_category, unit_price, quantity, line_total, image_path)
    select v_order, l.id, l.title, 'service', l.service_category, l.price, 1, l.price, l.image_path
    from public.listings l where l.id = any (v_ids) and l.shop_id = v_shop.shop_id;

    perform public.log_order_event(v_order, 'awaiting_payment', 'Event services booked. Waiting for payment.', 'customer');
  end loop;

  return v_booking;
end;
$$;

-- ---------------------------------------------------------------------
-- Payment (server only: test-mode checkout today, payment webhook later)
-- ---------------------------------------------------------------------

create or replace function public.confirm_payment(
  p_customer uuid,
  p_order_ids uuid[],
  p_method text,
  p_reference text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_count integer := 0;
begin
  for v_order in
    update public.orders
    set status = 'paid', payment_status = 'held', paid_at = now(),
        payment_method = p_method, payment_reference = p_reference
    where id = any (p_order_ids) and customer_id = p_customer and status = 'awaiting_payment'
    returning *
  loop
    v_count := v_count + 1;
    perform public.log_order_event(
      v_order.id, 'paid',
      case v_order.kind
        when 'gift' then 'Payment received and held by BOND. The shop will prepare your order.'
        when 'surprise' then 'Payment received and held by BOND. Your surprise is booked.'
        else 'Payment received and held by BOND. Your event service is booked.'
      end,
      'system');
  end loop;
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------
-- Customer: after ordering
-- ---------------------------------------------------------------------

create or replace function public.customer_order_action(p_order uuid, p_action text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order for update;
  if v_order.id is null or v_order.customer_id <> (select auth.uid()) then
    raise exception 'Order not found.';
  end if;

  if p_action = 'cancel' then
    if v_order.status not in ('awaiting_payment', 'paid') then
      raise exception 'This order can''t be cancelled anymore — the shop has already started on it.';
    end if;
    update public.orders
    set status = 'cancelled',
        payment_status = case when payment_status = 'held' then 'refunded' else payment_status end
    where id = p_order;
    perform public.log_order_event(p_order, 'cancelled',
      case when v_order.payment_status = 'held'
        then 'Cancelled by the customer. The held payment was refunded.'
        else 'Cancelled by the customer.' end,
      'customer');
    return 'cancelled';
  elsif p_action = 'confirm_received' then
    if v_order.status <> 'delivered' then
      raise exception 'You can confirm once the shop marks this order as delivered.';
    end if;
    update public.orders set status = 'completed', payment_status = 'released' where id = p_order;
    perform public.log_order_event(p_order, 'completed',
      'The customer confirmed everything went well. Payment released to the shop.', 'customer');
    return 'completed';
  end if;

  raise exception 'Unknown action.';
end;
$$;

create or replace function public.customer_report_order(p_order uuid, p_reason text, p_details text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_report uuid;
begin
  select * into v_order from public.orders where id = p_order for update;
  if v_order.id is null or v_order.customer_id <> (select auth.uid()) then
    raise exception 'Order not found.';
  end if;
  if v_order.status not in ('ready', 'delivery_failed', 'delivered') then
    raise exception 'You can report a problem once the order is out for delivery or delivered.';
  end if;

  insert into public.reports (order_id, customer_id, reason, details)
  values (p_order, v_order.customer_id, p_reason, trim(p_details))
  returning id into v_report;

  update public.orders set status = 'disputed' where id = p_order;
  perform public.log_order_event(p_order, 'disputed',
    'The customer reported a problem. Payment stays on hold while BOND reviews it.', 'customer');
  return v_report;
end;
$$;

create or replace function public.customer_review_order(p_order uuid, p_rating integer, p_comment text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_customer public.profiles;
  v_review uuid;
begin
  select * into v_order from public.orders where id = p_order;
  if v_order.id is null or v_order.customer_id <> (select auth.uid()) then
    raise exception 'Order not found.';
  end if;
  if v_order.status <> 'completed' then
    raise exception 'You can leave feedback after confirming the order.';
  end if;
  if exists (select 1 from public.reviews where order_id = p_order) then
    raise exception 'You already left feedback for this order.';
  end if;

  select * into v_customer from public.profiles where id = v_order.customer_id;
  insert into public.reviews (order_id, shop_id, customer_id, reviewer_name, rating, comment)
  values (
    p_order, v_order.shop_id, v_order.customer_id,
    coalesce(v_customer.first_name, 'Customer') || coalesce(' ' || left(v_customer.last_name, 1) || '.', ''),
    p_rating, nullif(trim(coalesce(p_comment, '')), ''))
  returning id into v_review;
  return v_review;
end;
$$;

create or replace function public.customer_booking_appointment(
  p_booking uuid,
  p_action text,
  p_at timestamptz default null,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.event_bookings;
  v_order record;
begin
  select * into v_booking from public.event_bookings where id = p_booking for update;
  if v_booking.id is null or v_booking.customer_id <> (select auth.uid()) then
    raise exception 'Booking not found.';
  end if;
  if not exists (select 1 from public.orders where booking_id = p_booking and status not in ('awaiting_payment', 'cancelled')) then
    raise exception 'Pay for your booking first.';
  end if;

  if p_action = 'request' then
    if p_at is null or p_at < now() + interval '1 hour' or p_at > v_booking.event_at then
      raise exception 'Choose an appointment time between now and your event.';
    end if;
    update public.event_bookings
    set appointment_status = 'requested', appointment_at = p_at,
        appointment_note = nullif(trim(coalesce(p_note, '')), '')
    where id = p_booking;
    for v_order in select id, status from public.orders where booking_id = p_booking and status <> 'cancelled' loop
      perform public.log_order_event(v_order.id, v_order.status,
        'The customer requested an appointment with you on ' ||
        to_char(p_at at time zone 'Asia/Manila', 'Mon DD, YYYY HH12:MI AM') || ' (PH time).', 'customer');
    end loop;
  elsif p_action = 'skip' then
    update public.event_bookings set appointment_status = 'skipped' where id = p_booking;
  else
    raise exception 'Unknown action.';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Vendor: working on orders
-- ---------------------------------------------------------------------

create or replace function public.vendor_order_action(p_order uuid, p_action text, p_note text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_next text;
  v_message text;
begin
  select * into v_order from public.orders where id = p_order for update;
  if v_order.id is null or not public.owns_shop(v_order.shop_id) then
    raise exception 'Order not found.';
  end if;
  if not public.is_approved_vendor((select auth.uid())) then
    raise exception 'Your vendor account isn''t verified.' using errcode = '42501';
  end if;

  if p_action = 'decline' and v_order.status = 'paid' then
    if char_length(trim(coalesce(p_note, ''))) < 5 then
      raise exception 'Tell the customer why you''re declining (at least 5 characters).';
    end if;
    v_next := 'cancelled';
    v_message := 'The shop declined this order: ' || trim(p_note) || ' The held payment was refunded.';
  elsif v_order.kind in ('gift', 'surprise') then
    if p_action = 'start_preparing' and v_order.status = 'paid' then
      v_next := 'preparing'; v_message := 'The shop is preparing your order.';
    elsif p_action = 'mark_ready' and v_order.status = 'preparing' then
      v_next := 'ready'; v_message := 'Your order is ready and on its way.';
    elsif p_action = 'mark_delivered' and v_order.status in ('ready', 'delivery_failed') then
      v_next := 'delivered'; v_message := 'The shop marked this order as delivered. Please confirm you received it.';
    elsif p_action = 'delivery_failed' and v_order.status = 'ready' then
      v_next := 'delivery_failed'; v_message := 'The delivery attempt didn''t go through. The shop will try again.';
    elsif p_action = 'retry_delivery' and v_order.status = 'delivery_failed' then
      v_next := 'ready'; v_message := 'The shop is trying the delivery again.';
    end if;
  else
    if p_action = 'confirm' and v_order.status = 'paid' then
      v_next := 'confirmed'; v_message := 'Your organizer confirmed the booking and appointment details.';
    elsif p_action = 'start_preparing' and v_order.status = 'confirmed' then
      v_next := 'preparing'; v_message := 'Your organizer is preparing for your event.';
    elsif p_action = 'mark_ready' and v_order.status = 'preparing' then
      v_next := 'ready'; v_message := 'Everything is prepared and ready to serve.';
    elsif p_action = 'mark_completed' and v_order.status = 'ready' then
      v_next := 'delivered'; v_message := 'The organizer marked the service as completed. Please confirm.';
    end if;
  end if;

  if v_next is null then
    raise exception 'That step isn''t available for this order right now.';
  end if;

  update public.orders
  set status = v_next,
      payment_status = case when v_next = 'cancelled' and payment_status = 'held' then 'refunded' else payment_status end
  where id = p_order;

  if p_note is not null and p_action <> 'decline' and char_length(trim(p_note)) > 0 then
    v_message := v_message || ' Note: ' || left(trim(p_note), 300);
  end if;
  perform public.log_order_event(p_order, v_next, v_message, 'vendor');
  return v_next;
end;
$$;

-- ---------------------------------------------------------------------
-- Admin: resolving reported problems
-- ---------------------------------------------------------------------

create or replace function public.admin_resolve_report(p_report uuid, p_resolution text, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report public.reports;
begin
  if not public.is_admin() then
    raise exception 'Only admins can resolve reports.' using errcode = '42501';
  end if;
  select * into v_report from public.reports where id = p_report for update;
  if v_report.id is null or v_report.status <> 'open' then
    raise exception 'This report is already resolved.';
  end if;
  if p_resolution not in ('refund', 'release') then
    raise exception 'Choose refund or release.';
  end if;

  update public.reports
  set status = 'resolved', resolution = p_resolution, admin_note = nullif(trim(coalesce(p_note, '')), ''),
      resolved_by = (select auth.uid()), resolved_at = now()
  where id = p_report;

  if p_resolution = 'refund' then
    update public.orders set status = 'cancelled', payment_status = 'refunded' where id = v_report.order_id;
    perform public.log_order_event(v_report.order_id, 'cancelled',
      'BOND reviewed the report and refunded the customer.' || coalesce(' Note: ' || nullif(trim(p_note), ''), ''), 'admin');
  else
    update public.orders set status = 'completed', payment_status = 'released' where id = v_report.order_id;
    perform public.log_order_event(v_report.order_id, 'completed',
      'BOND reviewed the report and released the payment to the shop.' || coalesce(' Note: ' || nullif(trim(p_note), ''), ''), 'admin');
  end if;
end;
$$;

-- Function permissions: callable by signed-in users (each checks the
-- caller itself); confirm_payment only by the server.
do $$
declare f text;
begin
  foreach f in array array[
    'public.place_gift_order(uuid, text, text, text, text, text)',
    'public.place_surprise_order(uuid, timestamptz, text, text, text, text, text)',
    'public.place_event_booking(text, text, timestamptz, text, integer, text, uuid[])',
    'public.customer_order_action(uuid, text)',
    'public.customer_report_order(uuid, text, text)',
    'public.customer_review_order(uuid, integer, text)',
    'public.customer_booking_appointment(uuid, text, timestamptz, text)',
    'public.vendor_order_action(uuid, text, text)',
    'public.admin_resolve_report(uuid, text, text)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end;
$$;

revoke execute on function public.confirm_payment(uuid, uuid[], text, text) from public, anon, authenticated;
grant execute on function public.confirm_payment(uuid, uuid[], text, text) to service_role;

-- ---------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------

revoke all on public.shops, public.listings, public.cart_items, public.event_bookings, public.orders,
  public.order_items, public.order_events, public.reviews, public.reports from anon, authenticated;
grant all on public.shops, public.listings, public.cart_items, public.event_bookings, public.orders,
  public.order_items, public.order_events, public.reviews, public.reports to service_role;
revoke all on sequence public.order_number_seq, public.booking_number_seq from anon, authenticated;
grant usage on sequence public.order_number_seq, public.booking_number_seq to service_role;

-- Public catalogue
grant select on public.shops, public.listings, public.reviews to anon, authenticated;

-- Vendors edit their own shop and listings (images are set by the server).
grant insert (vendor_id, slug, name, tagline, description, city, contact_number, delivery_fee, offers, is_open)
  on public.shops to authenticated;
grant update (slug, name, tagline, description, city, contact_number, delivery_fee, offers, is_open)
  on public.shops to authenticated;
grant insert (shop_id, kind, service_category, event_types, title, description, price, inclusions, is_active)
  on public.listings to authenticated;
-- Review columns are included for admins; the listings_guard trigger
-- ignores them for everyone else.
grant update (kind, service_category, event_types, title, description, price, inclusions, is_active,
  status, review_notes, reviewed_at, reviewed_by)
  on public.listings to authenticated;

grant delete on public.listings to authenticated;

grant select, insert, update, delete on public.cart_items to authenticated;
grant select on public.event_bookings, public.orders, public.order_items, public.order_events, public.reports
  to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.shops enable row level security;
alter table public.listings enable row level security;
alter table public.cart_items enable row level security;
alter table public.event_bookings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;

-- shops
drop policy if exists "Anyone can view open shops of verified vendors" on public.shops;
create policy "Anyone can view open shops of verified vendors"
  on public.shops for select to anon, authenticated
  using (is_open and public.is_approved_vendor(vendor_id));

drop policy if exists "Vendors can view their own shop" on public.shops;
create policy "Vendors can view their own shop"
  on public.shops for select to authenticated
  using (vendor_id = (select auth.uid()));

drop policy if exists "Admins can view all shops" on public.shops;
create policy "Admins can view all shops"
  on public.shops for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Verified vendors can create their shop" on public.shops;
create policy "Verified vendors can create their shop"
  on public.shops for insert to authenticated
  with check (vendor_id = (select auth.uid()) and public.is_approved_vendor((select auth.uid())));

drop policy if exists "Vendors can update their own shop" on public.shops;
create policy "Vendors can update their own shop"
  on public.shops for update to authenticated
  using (vendor_id = (select auth.uid()))
  with check (vendor_id = (select auth.uid()));

-- listings
drop policy if exists "Anyone can view approved listings" on public.listings;
create policy "Anyone can view approved listings"
  on public.listings for select to anon, authenticated
  using (
    status = 'approved' and is_active
    and exists (select 1 from public.shops s where s.id = shop_id and s.is_open and public.is_approved_vendor(s.vendor_id))
  );

drop policy if exists "Vendors can view their own listings" on public.listings;
create policy "Vendors can view their own listings"
  on public.listings for select to authenticated
  using (public.owns_shop(shop_id));

drop policy if exists "Admins can view all listings" on public.listings;
create policy "Admins can view all listings"
  on public.listings for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Verified vendors can add listings" on public.listings;
create policy "Verified vendors can add listings"
  on public.listings for insert to authenticated
  with check (public.owns_shop(shop_id) and public.is_approved_vendor((select auth.uid())));

drop policy if exists "Vendors can edit their own listings" on public.listings;
create policy "Vendors can edit their own listings"
  on public.listings for update to authenticated
  using (public.owns_shop(shop_id))
  with check (public.owns_shop(shop_id));

-- Deleting is safe: carts cascade, and orders keep their own item snapshot.
drop policy if exists "Vendors can delete their own listings" on public.listings;
create policy "Vendors can delete their own listings"
  on public.listings for delete to authenticated
  using (public.owns_shop(shop_id));

drop policy if exists "Admins can review listings" on public.listings;
create policy "Admins can review listings"
  on public.listings for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- cart_items (customers only, gifts only)
drop policy if exists "Customers manage their own cart" on public.cart_items;
create policy "Customers manage their own cart"
  on public.cart_items for all to authenticated
  using (customer_id = (select auth.uid()))
  with check (
    customer_id = (select auth.uid())
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'customer')
    and exists (select 1 from public.listings l where l.id = listing_id and l.kind = 'gift' and l.status = 'approved' and l.is_active)
  );

-- orders
drop policy if exists "Customers view their own orders" on public.orders;
create policy "Customers view their own orders"
  on public.orders for select to authenticated
  using (customer_id = (select auth.uid()));

drop policy if exists "Vendors view orders for their shop" on public.orders;
create policy "Vendors view orders for their shop"
  on public.orders for select to authenticated
  using (public.owns_shop(shop_id));

drop policy if exists "Admins view all orders" on public.orders;
create policy "Admins view all orders"
  on public.orders for select to authenticated
  using ((select public.is_admin()));

-- order_items / order_events follow the order's visibility
drop policy if exists "Order items follow their order" on public.order_items;
create policy "Order items follow their order"
  on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

drop policy if exists "Order events follow their order" on public.order_events;
create policy "Order events follow their order"
  on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

-- event_bookings
drop policy if exists "Customers view their own bookings" on public.event_bookings;
create policy "Customers view their own bookings"
  on public.event_bookings for select to authenticated
  using (customer_id = (select auth.uid()));

drop policy if exists "Vendors view bookings they serve" on public.event_bookings;
create policy "Vendors view bookings they serve"
  on public.event_bookings for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.booking_id = event_bookings.id and public.owns_shop(o.shop_id)
  ));

drop policy if exists "Admins view all bookings" on public.event_bookings;
create policy "Admins view all bookings"
  on public.event_bookings for select to authenticated
  using ((select public.is_admin()));

-- reviews are public
drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews"
  on public.reviews for select to anon, authenticated
  using (true);

-- reports
drop policy if exists "Customers view their own reports" on public.reports;
create policy "Customers view their own reports"
  on public.reports for select to authenticated
  using (customer_id = (select auth.uid()));

drop policy if exists "Vendors view reports on their orders" on public.reports;
create policy "Vendors view reports on their orders"
  on public.reports for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and public.owns_shop(o.shop_id)));

drop policy if exists "Admins view all reports" on public.reports;
create policy "Admins view all reports"
  on public.reports for select to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Public images for shops and listings (uploaded by the server only)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-media', 'public-media', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
