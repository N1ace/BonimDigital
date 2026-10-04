-- Bonim Digital — client projects (the "פרויקטים" tab in /admin/) + public tracking (track.html)
-- Run in the Supabase SQL editor AFTER booking-schema.sql (it reuses booking_admins / is_booking_admin()).

create table if not exists projects (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique check (code ~ '^BD-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  status           text not null default 'active' check (status in ('active','delayed','on_hold','closed')),

  client_name      text not null check (char_length(client_name) between 2 and 80),
  client_business  text check (client_business is null or char_length(client_business) <= 120),
  client_phone     text check (client_phone is null or client_phone ~ '^0[2-9][0-9]{7,8}$'),
  client_email     text check (client_email is null or (char_length(client_email) <= 120 and client_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  client_city      text check (client_city is null or char_length(client_city) <= 80),
  client_lang      text not null default 'he' check (client_lang in ('he','en')),

  title            text not null check (char_length(title) between 2 and 120),
  category         text not null default 'website' check (category in ('website','booking','store','app','existing','other')),
  summary          text check (summary is null or char_length(summary) <= 2000),
  start_date       date not null default current_date,
  deadline         date not null,
  requirements     jsonb not null default '[]'::jsonb check (jsonb_typeof(requirements) = 'array'),
  tips             jsonb not null default '[]'::jsonb check (jsonb_typeof(tips) = 'array'),
  -- [{k:'collect'|'build'|'deliver'|'edits', state:'pending'|'active'|'done'|'skipped', started_at, done_at, tasks:[{k|t, done}]}]
  stages           jsonb not null check (jsonb_typeof(stages) = 'array'),
  -- [{id, at, kind, stage?, until?, text?, public:boolean}]
  updates          jsonb not null default '[]'::jsonb check (jsonb_typeof(updates) = 'array'),
  delay_reason     text check (delay_reason is null or char_length(delay_reason) <= 500),
  delay_until      date,
  admin_note       text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  closed_at        timestamptz,
  constraint projects_dates check (deadline >= start_date)
);

create index if not exists projects_created_idx on projects (created_at desc);

create or replace function projects_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists projects_touch on projects;
create trigger projects_touch before update on projects for each row execute function projects_touch();

alter table projects enable row level security;

drop policy if exists projects_admin_select on projects;
drop policy if exists projects_admin_insert on projects;
drop policy if exists projects_admin_update on projects;
drop policy if exists projects_admin_delete on projects;
create policy projects_admin_select on projects for select to authenticated using (is_booking_admin());
create policy projects_admin_insert on projects for insert to authenticated with check (is_booking_admin());
create policy projects_admin_update on projects for update to authenticated using (is_booking_admin()) with check (is_booking_admin());
create policy projects_admin_delete on projects for delete to authenticated using (is_booking_admin());

-- Tracking password: 8 random characters (letters, digits, signs), shown to the admin in the project panel
-- and sent to the client with the code. Safe to run again on an existing database.
create extension if not exists pgcrypto with schema extensions;

create or replace function gen_project_pass() returns text
language plpgsql volatile set search_path = public, extensions as $$
declare
  -- no I, O, l, o, 0 or 1, so the password can't be misread
  abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%&*?+=';
  n constant int := length(abc);
  s text;
  b bytea;
begin
  loop
    s := '';
    b := gen_random_bytes(32);
    for i in 0..31 loop
      exit when length(s) = 8;
      if get_byte(b, i) < 256 - (256 % n) then s := s || substr(abc, get_byte(b, i) % n + 1, 1); end if;
    end loop;
    exit when length(s) = 8 and s ~ '[A-Za-z]' and s ~ '[2-9]' and s ~ '[!@#%&*?+=]';
  end loop;
  return s;
end;
$$;
-- authenticated keeps EXECUTE: the access_pass column default runs with the inserting admin's rights
revoke all on function gen_project_pass() from public, anon;
grant execute on function gen_project_pass() to authenticated;

alter table projects add column if not exists access_pass text;
-- showcase projects (linked from the public site as examples) open with the code alone
alter table projects add column if not exists showcase boolean not null default false;
update projects set access_pass = gen_project_pass() where access_pass is null;
alter table projects alter column access_pass set default gen_project_pass();
alter table projects alter column access_pass set not null;
alter table projects drop constraint if exists projects_pass_len;
alter table projects add constraint projects_pass_len check (char_length(access_pass) between 8 and 64);
update projects set showcase = true where code = 'BD-ARYN-0726';

-- Public tracking: the code AND the password are needed (except showcase projects).
-- A wrong code and a wrong password return the same null, so codes can't be probed.
-- Never returns the client's phone, email, the password or internal notes.
drop function if exists project_track(text);
create or replace function project_track(p_code text, p_pass text default null) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'code', p.code, 'status', p.status, 'title', p.title, 'category', p.category, 'summary', p.summary,
    'client', split_part(btrim(p.client_name), ' ', 1), 'business', p.client_business,
    'start_date', p.start_date, 'deadline', p.deadline,
    'requirements', p.requirements, 'tips', p.tips, 'stages', p.stages,
    'updates', coalesce((select jsonb_agg(u) from jsonb_array_elements(p.updates) u where coalesce((u ->> 'public')::boolean, true)), '[]'::jsonb),
    'delay_reason', p.delay_reason, 'delay_until', p.delay_until,
    'created_at', p.created_at, 'updated_at', p.updated_at, 'closed_at', p.closed_at
  )
  from projects p
  where p.code = upper(btrim(coalesce(p_code, '')))
    and (p.showcase or p.access_pass = coalesce(p_pass, ''))
$$;

revoke all on function project_track(text, text) from public;
grant execute on function project_track(text, text) to anon, authenticated;
