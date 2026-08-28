-- Digital Twin call-rate gate schema — see backend/main.py (the "Digital Twin
-- call-rate gate" section) for how this table is used. Entirely optional: the
-- gate fails open with unlimited calls if you skip this and don't set
-- SUPABASE_URL/SUPABASE_SERVICE_KEY.
--
-- To apply: create a Supabase project, open the SQL editor, and run this file.

create table public.call_sessions (
  id            uuid primary key,          -- the X-Call-Session-Id the client generated
  visitor_token text not null,             -- localStorage uuid, or ip_hash fallback
  ip_hash       text not null,             -- sha256(ip + IP_HASH_SALT), never the raw IP
  started_at    timestamptz not null default now(),
  seconds_used  int                        -- null until /api/call/end reports; self-heals via LEAST()
);

create index call_sessions_visitor_day_idx on public.call_sessions (visitor_token, started_at);
create index call_sessions_ip_day_idx      on public.call_sessions (ip_hash, started_at);

-- Service key bypasses RLS; enabling it with no policies locks out anon/authenticated entirely.
alter table public.call_sessions enable row level security;

-- Monthly minutes, UTC month. Unfinished rows (lost end-beacon, tab killed) count as
-- the time elapsed so far, capped at cap_seconds — conservative and self-healing.
create or replace function public.monthly_call_seconds(cap_seconds int default 600)
returns bigint
language sql
stable
as $$
  select coalesce(sum(
    least(
      coalesce(seconds_used, extract(epoch from (now() - started_at))::int),
      cap_seconds
    )
  ), 0)
  from public.call_sessions
  where started_at >= (date_trunc('month', now() at time zone 'utc') at time zone 'utc');
$$;
