-- ═══════════════════════════════════════════════════════════════════
-- NyaySetu — Unified Legal Consultation & Logistics Platform
-- Supabase schema. Idempotent: safe to run on a fresh project OR on an
-- existing one (it doubles as the migration).
--
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run.
--
-- NOTE ON CASING: Postgres folds unquoted identifiers to lower case, so
-- `CREATE TABLE Users` really creates `users`, and PostgREST (which is
-- case-sensitive) then only answers to `users`. Every table and column
-- below is written lower case so the SQL and the TypeScript agree.
-- ═══════════════════════════════════════════════════════════════════


-- ── 1. Tables ──────────────────────────────────────────────────────

create table if not exists public.users (
  uid   uuid primary key references auth.users(id) on delete cascade,
  name  text not null,
  email text not null unique,
  role  text not null check (role in ('client', 'lawyer', 'admin'))
);

create table if not exists public.lawyer_profiles (
  lawyer_id   uuid primary key references public.users(uid) on delete cascade,
  specialty   text    not null default 'General Practice',
  hourly_rate numeric not null default 1500 check (hourly_rate >= 0)
);

create table if not exists public.consultations (
  consultation_id uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.users(uid) on delete cascade,
  lawyer_id       uuid not null references public.users(uid) on delete cascade,
  status          text not null default 'scheduled' check (status in ('scheduled', 'completed'))
);

create table if not exists public.deliveries (
  delivery_id     uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.users(uid) on delete cascade,
  document_type   text not null,
  tracking_status text not null default 'ordered'
                  check (tracking_status in ('ordered', 'picked_up', 'in_transit', 'delivered'))
);


-- ── 2. Columns added after the first cut ───────────────────────────
-- Split out from the create statements above so this file stays runnable
-- against a database that already has the original four tables.

-- Consultations need a slot to be booked into, and somewhere for the
-- lawyer to keep case notes (PROJECT_SPEC §3: "view client case notes").
alter table public.consultations add column if not exists scheduled_at timestamptz not null default now();
alter table public.consultations add column if not exists case_notes   text;
alter table public.consultations add column if not exists created_at   timestamptz not null default now();

-- A courier cannot deliver a document without an address.
alter table public.deliveries add column if not exists delivery_address text not null default '';
alter table public.deliveries add column if not exists created_at       timestamptz not null default now();

create index if not exists consultations_client_id_idx on public.consultations (client_id);
create index if not exists consultations_lawyer_id_idx on public.consultations (lawyer_id);
create index if not exists deliveries_client_id_idx    on public.deliveries (client_id);


-- ── 3. Helper: role lookup that bypasses RLS ───────────────────────
-- Checking `public.users` from inside a policy on `public.users` would
-- recurse. A security-definer function reads the table directly instead.

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where uid = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;


-- ── 4. Row Level Security ──────────────────────────────────────────

alter table public.users           enable row level security;
alter table public.lawyer_profiles enable row level security;
alter table public.consultations   enable row level security;
alter table public.deliveries      enable row level security;

-- Users ─────────────────────────────────────────────────────────────
-- Names are shown across every dashboard (lawyer directory, delivery
-- table, consultation lists), so the row is readable. It holds no
-- secrets beyond the email.
drop policy if exists "users_select" on public.users;
create policy "users_select" on public.users
  for select using (true);

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self" on public.users
  for insert with check (auth.uid() = uid);

-- A user may edit their own row but may NOT promote themselves: role has
-- to stay whatever it already is.
drop policy if exists "users_update_self" on public.users;
create policy "users_update_self" on public.users
  for update
  using (auth.uid() = uid)
  with check (auth.uid() = uid and role = public.current_user_role());

-- Lawyer profiles ───────────────────────────────────────────────────
drop policy if exists "lawyer_profiles_select" on public.lawyer_profiles;
create policy "lawyer_profiles_select" on public.lawyer_profiles
  for select using (true);

drop policy if exists "lawyer_profiles_insert_self" on public.lawyer_profiles;
create policy "lawyer_profiles_insert_self" on public.lawyer_profiles
  for insert with check (auth.uid() = lawyer_id);

drop policy if exists "lawyer_profiles_update_self" on public.lawyer_profiles;
create policy "lawyer_profiles_update_self" on public.lawyer_profiles
  for update using (auth.uid() = lawyer_id) with check (auth.uid() = lawyer_id);

-- Consultations ─────────────────────────────────────────────────────
drop policy if exists "consultations_select_participants" on public.consultations;
create policy "consultations_select_participants" on public.consultations
  for select using (
    auth.uid() = client_id or auth.uid() = lawyer_id or public.is_admin()
  );

drop policy if exists "consultations_insert_client" on public.consultations;
create policy "consultations_insert_client" on public.consultations
  for insert with check (auth.uid() = client_id);

-- The assigned lawyer closes the consultation and writes the case notes.
drop policy if exists "consultations_update_lawyer" on public.consultations;
create policy "consultations_update_lawyer" on public.consultations
  for update using (auth.uid() = lawyer_id) with check (auth.uid() = lawyer_id);

-- Deliveries ────────────────────────────────────────────────────────
drop policy if exists "deliveries_select_owner_or_admin" on public.deliveries;
create policy "deliveries_select_owner_or_admin" on public.deliveries
  for select using (auth.uid() = client_id or public.is_admin());

drop policy if exists "deliveries_insert_client" on public.deliveries;
create policy "deliveries_insert_client" on public.deliveries
  for insert with check (auth.uid() = client_id);

-- Only the logistics admin moves a package along the tracking states.
drop policy if exists "deliveries_update_admin" on public.deliveries;
create policy "deliveries_update_admin" on public.deliveries
  for update using (public.is_admin()) with check (public.is_admin());


-- ── 5. Auth trigger: mirror auth.users into public.users ───────────
-- `role` comes from sign-up metadata, so it is untrusted input. Anything
-- other than 'lawyer' falls back to 'client' — an admin can only be made
-- by running SQL here in the dashboard (see §6).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data->>'role';
  safe_role      text := case when requested_role = 'lawyer' then 'lawyer' else 'client' end;
begin
  insert into public.users (uid, name, email, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    safe_role
  )
  on conflict (uid) do nothing;

  if safe_role = 'lawyer' then
    insert into public.lawyer_profiles (lawyer_id, specialty, hourly_rate)
    values (
      new.id,
      coalesce(nullif(new.raw_user_meta_data->>'specialty', ''), 'General Practice'),
      coalesce((new.raw_user_meta_data->>'hourly_rate')::numeric, 1500)
    )
    on conflict (lawyer_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── 6. Backfill ────────────────────────────────────────────────────
-- Any existing lawyer without a profile row gets a default one, so the
-- lawyer dashboard never renders against a missing record.

insert into public.lawyer_profiles (lawyer_id, specialty, hourly_rate)
select u.uid, 'General Practice', 1500
from public.users u
where u.role = 'lawyer'
  and not exists (select 1 from public.lawyer_profiles p where p.lawyer_id = u.uid);

-- To promote someone to admin (there is deliberately no self-serve path):
--   update public.users set role = 'admin' where email = 'you@example.com';
