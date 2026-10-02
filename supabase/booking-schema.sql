-- Bonim Digital — call & session booking
-- Run once in the Supabase SQL editor of the project whose URL/anon key go into assets/booking/config.js.
-- Then: Authentication → Users → "Add user" with your email + password (the calendar login),
-- insert that email into booking_admins (last line), and turn OFF "Allow new users to sign up".

create table if not exists booking_services (
  id        text primary key,
  minutes   int  not null check (minutes between 10 and 180),
  active    boolean not null default true
);

-- 0 = Sunday … 6 = Saturday, Israel time
create table if not exists booking_hours (
  dow        int primary key check (dow between 0 and 6),
  open_time  time not null,
  close_time time not null check (close_time > open_time)
);

create table if not exists bookings (
  id          uuid primary key default gen_random_uuid(),
  service_id  text not null references booking_services(id),
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  name        text not null check (char_length(name) between 2 and 80),
  phone       text not null check (phone ~ '^0[2-9][0-9]{7,8}$'),
  email       text check (email is null or char_length(email) <= 120),
  business    text check (business is null or char_length(business) <= 120),
  meeting     text not null default 'phone' check (meeting in ('phone','video','whatsapp')),
  note        text check (note is null or char_length(note) <= 1000),
  lang        text not null default 'he' check (lang in ('he','en')),
  status      text not null default 'confirmed' check (status in ('confirmed','done','cancelled','no_show')),
  admin_note  text,
  created_at  timestamptz not null default now(),
  constraint bookings_time_order check (end_at > start_at),
  constraint bookings_no_overlap exclude using gist (tstzrange(start_at, end_at, '[)') with &&)
    where (status <> 'cancelled')
);

create index if not exists bookings_start_idx on bookings (start_at);

create table if not exists booking_admins (
  email text primary key
);

-- Keep in sync with assets/booking/config.js
insert into booking_services (id, minutes) values
  ('intro', 15), ('website', 45), ('booking', 30), ('store', 45), ('app', 60), ('review', 30)
on conflict (id) do update set minutes = excluded.minutes;

insert into booking_hours (dow, open_time, close_time) values
  (0, '09:00', '18:00'), (1, '09:00', '18:00'), (2, '09:00', '18:00'),
  (3, '09:00', '18:00'), (4, '09:00', '18:00'), (5, '09:00', '13:00')
on conflict (dow) do update set open_time = excluded.open_time, close_time = excluded.close_time;

-- ---------- access ----------
alter table bookings         enable row level security;
alter table booking_services enable row level security;
alter table booking_hours    enable row level security;
alter table booking_admins   enable row level security;

create or replace function is_booking_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from booking_admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function is_booking_admin() from public, anon;
grant execute on function is_booking_admin() to authenticated;

drop policy if exists bookings_admin_select on bookings;
drop policy if exists bookings_admin_update on bookings;
drop policy if exists bookings_admin_delete on bookings;
create policy bookings_admin_select on bookings for select to authenticated using (is_booking_admin());
create policy bookings_admin_update on bookings for update to authenticated using (is_booking_admin()) with check (is_booking_admin());
create policy bookings_admin_delete on bookings for delete to authenticated using (is_booking_admin());

-- Public side never reads the table: only busy ranges (no personal data) and a validated insert.
create or replace function booking_busy(p_from timestamptz, p_to timestamptz)
returns table (start_at timestamptz, end_at timestamptz)
language sql stable security definer set search_path = public as $$
  select b.start_at, b.end_at
  from bookings b
  where b.status <> 'cancelled'
    and p_to > p_from
    and p_to - p_from <= interval '70 days'
    and b.start_at < p_to and b.end_at > p_from
  order by b.start_at;
$$;

create or replace function booking_create(
  p_service text, p_start timestamptz, p_name text, p_phone text,
  p_email text default null, p_business text default null,
  p_meeting text default 'phone', p_note text default null, p_lang text default 'he'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_minutes int;
  v_end     timestamptz;
  v_local   timestamp;
  v_hours   booking_hours%rowtype;
  v_id      uuid;
begin
  select minutes into v_minutes from booking_services where id = p_service and active;
  if v_minutes is null then raise exception 'invalid_service' using errcode = '22023'; end if;

  if p_start < now() + interval '2 hours' or p_start > now() + interval '60 days' then
    raise exception 'invalid_time' using errcode = '22023';
  end if;

  v_local := p_start at time zone 'Asia/Jerusalem';
  if extract(minute from v_local)::int % 15 <> 0 or extract(second from v_local) <> 0 then
    raise exception 'invalid_time' using errcode = '22023';
  end if;

  select * into v_hours from booking_hours where dow = extract(dow from v_local)::int;
  v_end := p_start + make_interval(mins => v_minutes);
  if not found
     or v_local::time < v_hours.open_time
     or (v_end at time zone 'Asia/Jerusalem')::time > v_hours.close_time
     or (v_end at time zone 'Asia/Jerusalem')::date <> v_local::date then
    raise exception 'invalid_time' using errcode = '22023';
  end if;

  insert into bookings (service_id, start_at, end_at, name, phone, email, business, meeting, note, lang)
  values (
    p_service, p_start, v_end,
    btrim(p_name), regexp_replace(p_phone, '\D', '', 'g'),
    nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_business, '')), ''),
    coalesce(p_meeting, 'phone'), nullif(btrim(coalesce(p_note, '')), ''),
    case when p_lang = 'en' then 'en' else 'he' end
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function booking_busy(timestamptz, timestamptz) from public;
revoke all on function booking_create(text, timestamptz, text, text, text, text, text, text, text) from public;
grant execute on function booking_busy(timestamptz, timestamptz) to anon, authenticated;
grant execute on function booking_create(text, timestamptz, text, text, text, text, text, text, text) to anon, authenticated;

-- Replace with the email you log in with on /admin/
-- insert into booking_admins (email) values ('you@example.com') on conflict do nothing;
