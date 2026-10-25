-- OurDay schema. Owned by the migration role; the app connects as ourday_app,
-- which is NOT the owner, so row level security is actually enforced on it.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- identity --

create table users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text not null default '',
  created_at timestamptz not null default now()
);

-- Magic links. Only the hash is stored: a leaked table must not be a set of
-- working login links.
create table login_tokens (
  token_hash bytea primary key,
  email      text not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create table email_outbox (
  id         uuid primary key default gen_random_uuid(),
  to_email   text not null,
  subject    text not null,
  body       text not null,
  sent_at    timestamptz,
  created_at timestamptz not null default now()
);

-- Shared by public forms and magic-link requests. Postgres is already here;
-- a second datastore for counters is not worth its own operational surface.
-- ponytail: fixed window, not sliding. Swap for a sliding window only if abuse
-- actually clusters on window edges.
create table rate_limits (
  bucket       text primary key,
  window_start timestamptz not null,
  hits         int not null
);

-- ----------------------------------------------------------------- weddings --

create table weddings (
  id                    uuid primary key default gen_random_uuid(),
  groom_name            text not null default '',
  bride_name            text not null default '',
  event_date            date,
  checkin_photo_enabled boolean not null default false,
  created_at            timestamptz not null default now()
);

create table wedding_members (
  wedding_id uuid not null references weddings(id) on delete cascade,
  user_id    uuid not null references users(id) on delete cascade,
  role       text not null check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  primary key (wedding_id, user_id)
);

-- Receptionists are not account holders. A scanner link grants exactly two
-- powers on exactly one wedding: read guests, write check-ins.
create table scanner_links (
  id         uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  token_hash bytea not null unique,
  label      text not null default 'Meja 1',
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- -------------------------------------------------------------- invitations --

create table invitations (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid not null references weddings(id) on delete cascade,
  slug          text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'),
  template_id   text not null default 'classic',
  theme         jsonb not null default '{}'::jsonb,
  content       jsonb not null default '{}'::jsonb,
  status        text not null default 'draft' check (status in ('draft', 'published')),
  rsvp_deadline timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index on invitations (wedding_id);

-- ------------------------------------------------------------------- guests --

-- One row per guest per wedding. Invitation, RSVP and check-in all hang off
-- this row: that is the whole reason the three products are one product.
create table guests (
  id                      uuid primary key default gen_random_uuid(),
  wedding_id              uuid not null references weddings(id) on delete cascade,
  name                    text not null,
  phone                   text,
  guest_group             text not null default '',
  session_label           text not null default '',
  pax_allowed             int  not null default 2 check (pax_allowed between 1 and 20),
  token                   text not null unique,
  sent_at                 timestamptz,
  first_opened_at         timestamptz,
  checked_in_at           timestamptz,
  checked_in_pax          int,
  checkin_photo_path      text,
  checkin_client_event_id text,
  created_at              timestamptz not null default now()
);
create index on guests (wedding_id);
create index on guests (wedding_id, lower(name));

create table rsvps (
  id         uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  guest_id   uuid unique references guests(id) on delete cascade,
  name       text not null,
  attending  text not null check (attending in ('yes', 'no')),
  pax        int  not null check (pax >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on rsvps (wedding_id);

create table wishes (
  id         uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  guest_id   uuid references guests(id) on delete set null,
  name       text not null,
  message    text not null check (length(message) between 1 and 1000),
  hidden_at  timestamptz,
  created_at timestamptz not null default now()
);
create index on wishes (wedding_id, created_at desc);

-- ------------------------------------------------------------------ planner --

-- Seven planner features, one table. They are the same shape: titled rows with
-- an order, some with money, some with a date, some with a done flag.
-- ponytail: kind-specific fields live in `meta` and are validated in the app,
-- not the database. Split a kind out only if it grows past ~3 special fields.
create table planner_items (
  wedding_id     uuid not null references weddings(id) on delete cascade,
  id             uuid primary key default gen_random_uuid(),
  kind           text not null check (kind in
                   ('budget', 'todo', 'rundown', 'seserahan', 'seragam', 'tabungan', 'vendor')),
  parent_id      uuid references planner_items(id) on delete cascade,
  title          text not null,
  note           text not null default '',
  amount_planned numeric(14, 2),
  amount_actual  numeric(14, 2),
  due_at         timestamptz,
  done_at        timestamptz,
  position       int not null default 0,
  meta           jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index on planner_items (wedding_id, kind, position);
create index on planner_items (parent_id);

-- ------------------------------------------------------------------- orders --

-- Entitlement has no table of its own: access to a product IS a paid, unexpired
-- order row. A manual grant is a zero-rupiah order, which makes it auditable
-- instead of invisible.
create table orders (
  id                uuid primary key default gen_random_uuid(),
  wedding_id        uuid not null references weddings(id) on delete cascade,
  product           text not null check (product in ('invitation', 'guestbook')),
  amount            int  not null check (amount >= 0),
  provider_order_id text not null unique,
  status            text not null default 'pending'
                      check (status in ('pending', 'paid', 'failed', 'expired')),
  payload           jsonb not null default '{}'::jsonb,
  paid_at           timestamptz,
  expires_at        timestamptz,
  created_at        timestamptz not null default now()
);
create index on orders (wedding_id, product);

-- ------------------------------------------------------- rls: who is asking --

create function app_user_id() returns uuid
  language sql stable as $$
    select nullif(current_setting('app.user_id', true), '')::uuid
  $$;

create function app_guest_token() returns text
  language sql stable as $$
    select nullif(current_setting('app.guest_token', true), '')
  $$;

create function app_scanner_wedding() returns uuid
  language sql stable as $$
    select nullif(current_setting('app.scanner_wedding_id', true), '')::uuid
  $$;

-- security definer: membership is the thing every other policy asks about, so
-- it must not itself be filtered by a policy on wedding_members.
create function app_is_member(w uuid) returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (
      select 1 from wedding_members m
      where m.wedding_id = w and m.user_id = app_user_id()
    )
  $$;

create function app_wedding_of_slug(s text) returns uuid
  language sql stable security definer set search_path = public as $$
    select wedding_id from invitations where slug = s and status = 'published'
  $$;

-- Bootstrap. A wedding and its first membership must appear together: the
-- weddings policy asks app_is_member(id), which cannot be true until the
-- membership exists, and a data-modifying CTE cannot see its sibling's insert.
-- The owner is taken from the session setting, never from an argument, so the
-- caller cannot create a wedding owned by someone else.
create function app_create_wedding() returns uuid
  language plpgsql security definer set search_path = public as $$
  declare v_uid uuid := app_user_id(); v_id uuid;
  begin
    if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
    insert into weddings default values returning id into v_id;
    insert into wedding_members (wedding_id, user_id, role) values (v_id, v_uid, 'owner');
    return v_id;
  end $$;

-- ------------------------------------------------------------- rls: policies --

alter table weddings        enable row level security;
alter table wedding_members enable row level security;
alter table scanner_links   enable row level security;
alter table invitations     enable row level security;
alter table guests          enable row level security;
alter table rsvps           enable row level security;
alter table wishes          enable row level security;
alter table planner_items   enable row level security;
alter table orders          enable row level security;

create policy w_member on weddings
  for all using (app_is_member(id) or app_scanner_wedding() = id)
  with check (app_is_member(id));

create policy wm_self on wedding_members
  for all using (user_id = app_user_id() or app_is_member(wedding_id))
  with check (app_is_member(wedding_id));

create policy sl_member on scanner_links
  for all using (app_is_member(wedding_id)) with check (app_is_member(wedding_id));

-- Published invitations are readable by the world; only members can write.
create policy inv_read on invitations
  for select using (status = 'published' or app_is_member(wedding_id));
create policy inv_write on invitations
  for all using (app_is_member(wedding_id)) with check (app_is_member(wedding_id));

-- A guest row is visible to its members, to a scanner working that wedding, and
-- to whoever holds that guest's own token. Nothing else.
create policy g_read on guests
  for select using (
    app_is_member(wedding_id)
    or app_scanner_wedding() = wedding_id
    or token = app_guest_token()
  );
create policy g_write_member on guests
  for all using (app_is_member(wedding_id)) with check (app_is_member(wedding_id));
-- The scanner may only ever touch check-in columns; enforced in the action, and
-- bounded here to the one wedding its link names.
create policy g_write_scanner on guests
  for update using (app_scanner_wedding() = wedding_id)
  with check (app_scanner_wedding() = wedding_id);

create policy r_read on rsvps
  for select using (
    app_is_member(wedding_id)
    or guest_id in (select id from guests where token = app_guest_token())
  );
create policy r_public_write on rsvps
  for all using (
    app_is_member(wedding_id)
    or guest_id in (select id from guests where token = app_guest_token())
  )
  with check (
    app_is_member(wedding_id)
    or exists (select 1 from invitations i
               where i.wedding_id = rsvps.wedding_id and i.status = 'published')
  );

create policy wi_read on wishes
  for select using (hidden_at is null or app_is_member(wedding_id));
create policy wi_insert on wishes
  for insert with check (
    exists (select 1 from invitations i
            where i.wedding_id = wishes.wedding_id and i.status = 'published')
  );
create policy wi_moderate on wishes
  for update using (app_is_member(wedding_id)) with check (app_is_member(wedding_id));

-- No scanner clause anywhere below: a receptionist's link cannot reach the
-- couple's budget or their payments.
create policy p_member on planner_items
  for all using (app_is_member(wedding_id)) with check (app_is_member(wedding_id));

create policy o_member on orders
  for all using (app_is_member(wedding_id)) with check (app_is_member(wedding_id));

-- ------------------------------------------- auth: privileged, one pool only --

-- users, login_tokens, email_outbox and rate_limits are global, not per-wedding,
-- so RLS cannot express "the auth flow may touch this". Instead the app role is
-- denied them outright and reaches them only through these definer functions.
-- One connection pool, no ambient privilege.

alter table users        enable row level security;
alter table login_tokens enable row level security;
alter table email_outbox enable row level security;
alter table rate_limits  enable row level security;

create policy u_self on users for select using (id = app_user_id());
create policy u_self_update on users
  for update using (id = app_user_id()) with check (id = app_user_id());
-- login_tokens, email_outbox, rate_limits: no policy at all = no direct access.

create function auth_issue_login(p_email text, p_hash bytea, p_ttl interval)
  returns void language sql security definer set search_path = public as $$
    insert into login_tokens (token_hash, email, expires_at)
    values (p_hash, lower(p_email), now() + p_ttl)
  $$;

-- Single use and expiry are enforced here, in one statement, so there is no
-- window between checking and consuming.
create function auth_consume_login(p_hash bytea)
  returns uuid language plpgsql security definer set search_path = public as $$
  declare v_email text; v_id uuid;
  begin
    update login_tokens set used_at = now()
     where token_hash = p_hash and used_at is null and expires_at > now()
    returning email into v_email;

    if v_email is null then return null; end if;

    insert into users (email) values (v_email)
      on conflict (email) do update set email = excluded.email
    returning id into v_id;

    return v_id;
  end $$;

create function send_email(p_to text, p_subject text, p_body text)
  returns uuid language sql security definer set search_path = public as $$
    insert into email_outbox (to_email, subject, body)
    values (p_to, p_subject, p_body) returning id
  $$;

-- Returns true when the caller is still under the limit. Fixed window.
create function rl_hit(p_bucket text, p_window interval, p_max int)
  returns boolean language plpgsql security definer set search_path = public as $$
  declare v_hits int;
  begin
    insert into rate_limits (bucket, window_start, hits)
    values (p_bucket, now(), 1)
    on conflict (bucket) do update set
      window_start = case when rate_limits.window_start < now() - p_window
                          then now() else rate_limits.window_start end,
      hits         = case when rate_limits.window_start < now() - p_window
                          then 1 else rate_limits.hits + 1 end
    returning hits into v_hits;
    return v_hits <= p_max;
  end $$;
