-- ============================================================================
-- Jordan sale — in-house reservation + chat backend (Supabase / Postgres)
-- ----------------------------------------------------------------------------
-- Run this ONCE in your Supabase project: SQL Editor → New query → paste → Run.
-- Safe to re-run: it drops and recreates the functions/policies each time.
--
-- Security model:
--   * Buyers are anonymous. They never touch the tables directly — Row Level
--     Security denies the `anon` role all table access. They can only call the
--     three SECURITY DEFINER functions below, each gated by a secret 122-bit
--     thread_token (uuid). No token → no data, and tokens can't be enumerated.
--   * The admin logs in with Supabase Auth (email + password). Authenticated
--     users get full read/write via RLS, so the admin sees every reservation.
-- ============================================================================

-- ---------- Tables ----------------------------------------------------------
create table if not exists public.reservations (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  thread_token   uuid not null unique default gen_random_uuid(),
  shoe_style     text not null,
  shoe_name      text not null,
  price          numeric,
  size_us        text,
  size_eu        text,
  buyer_name     text not null,
  buyer_contact  text,
  note           text,
  status         text not null default 'new',
  last_message_at timestamptz not null default now()
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  reservation_id  uuid not null references public.reservations(id) on delete cascade,
  created_at      timestamptz not null default now(),
  sender          text not null check (sender in ('buyer','admin')),
  body            text not null
);

create index if not exists messages_reservation_idx
  on public.messages (reservation_id, created_at);
create index if not exists reservations_activity_idx
  on public.reservations (last_message_at desc);

-- ---------- Row Level Security ----------------------------------------------
alter table public.reservations enable row level security;
alter table public.messages     enable row level security;

-- Admin (any authenticated user) → full access. Buyers (anon) → no table
-- policies at all, so RLS denies them; they reach data only via the RPCs.
drop policy if exists admin_all_reservations on public.reservations;
create policy admin_all_reservations on public.reservations
  for all to authenticated using (true) with check (true);

drop policy if exists admin_all_messages on public.messages;
create policy admin_all_messages on public.messages
  for all to authenticated using (true) with check (true);

-- ---------- RPCs for anonymous buyers ---------------------------------------
-- 1) Create a reservation, return the buyer's private thread token.
create or replace function public.create_reservation(
  p_shoe_style    text,
  p_shoe_name     text,
  p_price         numeric,
  p_size_us       text,
  p_size_eu       text,
  p_buyer_name    text,
  p_buyer_contact text,
  p_note          text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
begin
  -- Name is optional (anonymous allowed); fall back to a neutral label.
  insert into public.reservations
    (shoe_style, shoe_name, price, size_us, size_eu, buyer_name, buyer_contact, note)
  values
    (left(p_shoe_style, 40), left(p_shoe_name, 120), p_price,
     left(p_size_us, 12), left(p_size_eu, 12),
     coalesce(nullif(left(btrim(p_buyer_name), 80), ''), 'Anonīms'),
     left(p_buyer_contact, 160), left(p_note, 500))
  returning thread_token into v_token;

  return v_token;
end;
$$;

-- 1b) Start a general anonymous chat (not tied to a specific shoe).
-- p_context is an optional short label, e.g. the page/shoe the visitor was on.
create or replace function public.start_chat(p_context text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
begin
  insert into public.reservations
    (shoe_style, shoe_name, buyer_name, note, status)
  values
    ('CHAT', 'Vispārīgs čats', 'Anonīms',
     nullif(left(btrim(p_context), 200), ''), 'chat')
  returning thread_token into v_token;

  return v_token;
end;
$$;

-- 2) Fetch a thread (reservation summary + ordered messages) by token.
create or replace function public.get_thread(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_res public.reservations;
  v_msgs json;
begin
  select * into v_res from public.reservations where thread_token = p_token;
  if not found then
    return null;
  end if;

  select coalesce(json_agg(m order by m.created_at), '[]'::json) into v_msgs
  from (
    select created_at, sender, body
    from public.messages
    where reservation_id = v_res.id
  ) m;

  return json_build_object(
    'shoe_style', v_res.shoe_style,
    'shoe_name',  v_res.shoe_name,
    'price',      v_res.price,
    'size_us',    v_res.size_us,
    'size_eu',    v_res.size_eu,
    'buyer_name', v_res.buyer_name,
    'status',     v_res.status,
    'created_at', v_res.created_at,
    'messages',   v_msgs
  );
end;
$$;

-- 3) Post a buyer message into a thread by token.
create or replace function public.post_message(p_token uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if coalesce(btrim(p_body), '') = '' then
    raise exception 'empty message';
  end if;

  select id into v_id from public.reservations where thread_token = p_token;
  if not found then
    raise exception 'thread not found';
  end if;

  insert into public.messages (reservation_id, sender, body)
  values (v_id, 'buyer', left(btrim(p_body), 2000));

  update public.reservations set last_message_at = now() where id = v_id;
end;
$$;

-- ---------- Grants ----------------------------------------------------------
-- Lock down the functions, then hand only these three to anonymous buyers.
revoke all on function public.create_reservation(text,text,numeric,text,text,text,text,text) from public;
revoke all on function public.start_chat(text) from public;
revoke all on function public.get_thread(uuid) from public;
revoke all on function public.post_message(uuid,text) from public;

grant execute on function public.create_reservation(text,text,numeric,text,text,text,text,text) to anon, authenticated;
grant execute on function public.start_chat(text) to anon, authenticated;
grant execute on function public.get_thread(uuid) to anon, authenticated;
grant execute on function public.post_message(uuid,text) to anon, authenticated;

-- ============================================================================
-- Next steps (in the Supabase dashboard):
--   1. Authentication → Users → Add user  (your admin email + password).
--      This is who logs into admin.html. Create only the accounts you trust.
--   2. Copy Project URL + anon public key (Settings → API) into
--      supabase-config.js in this repo.
-- Done — reservations and chat now work end-to-end on your own site.
-- ============================================================================
