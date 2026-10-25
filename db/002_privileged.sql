-- Operations that legitimately have no session behind them, so RLS cannot
-- express who is allowed to perform them. Each is narrow on purpose: it takes an
-- unguessable token or an opaque provider id, and returns only what that token
-- entitles the caller to see.
--
-- Everything here is idempotent and re-applied by scripts/migrate.ts on every
-- run, so changing one of these does not need a database reset.

-- Earlier drafts of these lived under different names; drop them so a long-lived
-- database does not keep a second, stale implementation callable.
drop function if exists app_apply_payment(text, text, jsonb, int);
drop function if exists app_rundown_by_share(text);
drop function if exists app_wedding_by_share(text);
drop trigger  if exists guests_checkin_notify on guests;
drop function if exists notify_checkin();

-- ------------------------------------------------- rundown, shared read-only --

-- The MC and the vendors need the rundown without an account, and it must always
-- be the current version rather than a document mailed around. The token lives
-- in meta.shareToken on one rundown row; revoking is clearing that key.
create or replace function rundown_by_share_token(p_token text) returns jsonb
  language sql stable security definer set search_path = public as $$
    select jsonb_build_object(
      'groom_name', w.groom_name,
      'bride_name', w.bride_name,
      'event_date', w.event_date,
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'id', i.id, 'title', i.title, 'note', i.note,
                 'due_at', i.due_at, 'meta', i.meta)
               order by i.due_at nulls last, i.position)
          from planner_items i
         where i.wedding_id = p.wedding_id and i.kind = 'rundown'), '[]'::jsonb))
      from planner_items p
      join weddings w on w.id = p.wedding_id
     where p.kind = 'rundown' and p.meta ->> 'shareToken' = p_token
     limit 1
  $$;

-- The guest-facing half of the same rows. A published invitation is world
-- readable, but planner_items is members-only, so a guest reading the schedule
-- on an invitation has no way through RLS. This is the narrowest possible hole:
--   * only rows the couple explicitly ticked (meta.guest), never the whole
--     run-of-show, which names vendors and staff;
--   * only titles, notes and times — meta.pic stays behind, so "MC Yudha" and
--     the internal share token never cross into a public page;
--   * only while an invitation for that wedding is actually published, so
--     unpublishing takes the schedule down with it.
create or replace function public_rundown(p_wedding_id uuid)
  returns table (title text, note text, due_at timestamptz)
  language sql stable security definer set search_path = public as $$
    select i.title, i.note, i.due_at
      from planner_items i
     where i.wedding_id = p_wedding_id
       and i.kind = 'rundown'
       and (i.meta ->> 'guest')::boolean is true
       and exists (select 1 from invitations v
                    where v.wedding_id = p_wedding_id and v.status = 'published')
     order by i.due_at nulls last, i.position
  $$;

-- ----------------------------------------------------------- payment webhook --

-- The only path that may mark an order paid. Midtrans has no session and it
-- re-sends notifications, so every guarantee that matters lives here:
--   * an already-paid row is frozen — no second expiry window, no downgrade;
--   * paid_at is stamped exactly once, on the first transition;
--   * SELECT ... FOR UPDATE serialises two notifications racing each other.
-- Active periods arrive as a map because the webhook knows only the provider's
-- order id; it cannot learn the product until it has read the row, which is the
-- very thing RLS is stopping it from doing. The map keeps the calibration
-- constant in lib/products.ts rather than duplicating it in SQL.
-- Signature verification happens in the application BEFORE this is reached.
create or replace function order_apply_notification(
  p_provider_order_id text,
  p_status            text,
  p_payload           jsonb,
  p_active_days       jsonb   -- {"invitation": 90, "guestbook": 30}
) returns setof orders
language plpgsql security definer set search_path = public as $$
  declare v orders;
  begin
    select * into v from orders
     where provider_order_id = p_provider_order_id for update;
    if not found then return; end if;

    if v.status = 'paid' then
      return next v; return;
    end if;

    if p_status = 'paid' then
      update orders set status = 'paid', payload = p_payload, paid_at = now(),
             expires_at = now() + (((p_active_days ->> v.product)::int) * interval '1 day')
       where id = v.id returning * into v;
    else
      update orders set status = p_status, payload = p_payload
       where id = v.id returning * into v;
    end if;
    return next v;
  end $$;

-- ---------------------------------------------------------- reception desk --

-- A scanner link must be resolvable before any identity exists — that is the
-- whole point of it. Only the hash is ever compared.
create or replace function app_resolve_scanner(p_hash bytea)
  returns table (wedding_id uuid, label text)
  language sql stable security definer set search_path = public as $$
    select s.wedding_id, s.label from scanner_links s
     where s.token_hash = p_hash and s.revoked_at is null and s.expires_at > now()
  $$;

-- Check-in must refuse when the guestbook was never paid for, but a receptionist
-- must never be able to read the couple's orders. So the answer crosses the
-- boundary as a single boolean and nothing else.
create or replace function app_has_product(w uuid, p text) returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (
      select 1 from orders o
       where o.wedding_id = w and o.product = p and o.status = 'paid'
         and (o.expires_at is null or o.expires_at > now()))
  $$;

-- Walk-in guests: someone who is not on the list still has to be recorded.
-- g_write_scanner covers UPDATE only, so insertion needs its own policy.
drop policy if exists g_insert_scanner on guests;
create policy g_insert_scanner on guests
  for insert with check (app_scanner_wedding() = wedding_id);

-- Opening your own invitation is the single write a guest token may perform.
-- A policy cannot express it: UPDATE is granted per row, not per column, so any
-- policy wide enough to stamp first_opened_at is also wide enough to let the
-- link holder raise their own pax_allowed. One column, one function.
create or replace function guest_mark_opened(p_token text) returns void
  language sql security definer set search_path = public as $$
    update guests set first_opened_at = now()
     where token = p_token and first_opened_at is null
  $$;

-- ------------------------------------------------------- live check-in feed --

-- The projector screen and the couple's phone both want arrivals as they happen.
-- LISTEN/NOTIFY is already in the database; a websocket library would be a
-- dependency for something Postgres does natively.
-- The payload is only the wedding id: subscribers re-read, which keeps guest
-- names out of a broadcast channel and keeps the payload under the 8kB limit.
-- INSERT matters as much as UPDATE — a walk-in arrives already checked in.
create or replace function guests_checkin_notify() returns trigger
  language plpgsql as $$
  begin
    if tg_op = 'INSERT' then
      if new.checked_in_at is not null then
        perform pg_notify('checkin', new.wedding_id::text);
      end if;
    elsif new.checked_in_at      is distinct from old.checked_in_at
       or new.checkin_photo_path is distinct from old.checkin_photo_path then
      perform pg_notify('checkin', new.wedding_id::text);
    end if;
    return null;
  end $$;

drop trigger if exists guests_checkin_notify_t on guests;
create trigger guests_checkin_notify_t
  after insert or update on guests
  for each row execute function guests_checkin_notify();
