-- Bonim Digital — marketing consents (privacy policy section 8, Communications Law section 30A)
-- Run AFTER contact-schema.sql and booking-schema.sql. Safe to run again.
-- Two separate opt-ins, both off unless the visitor ticks them:
--   marketing_opt_in    = WhatsApp lists, SMS and email offers
--   ads_audience_opt_in = phone/email uploaded to Meta / Google ad audiences
-- marketing_opt_out_at is set by the admin when someone replies "הסר".

alter table contact_messages
  add column if not exists marketing_opt_in       boolean not null default false,
  add column if not exists marketing_opt_in_at    timestamptz,
  add column if not exists ads_audience_opt_in    boolean not null default false,
  add column if not exists ads_audience_opt_in_at timestamptz,
  add column if not exists opt_in_source          text,
  add column if not exists marketing_opt_out_at   timestamptz;

alter table bookings
  add column if not exists marketing_opt_in       boolean not null default false,
  add column if not exists marketing_opt_in_at    timestamptz,
  add column if not exists ads_audience_opt_in    boolean not null default false,
  add column if not exists ads_audience_opt_in_at timestamptz,
  add column if not exists opt_in_source          text,
  add column if not exists marketing_opt_out_at   timestamptz;

-- The new parameters have defaults, so a page that still sends the old fields keeps working.
drop function if exists contact_create(text, text, text, text, text, text, text);
create or replace function contact_create(
  p_name text, p_phone text, p_email text default null, p_business text default null,
  p_topic text default 'unsure', p_message text default null, p_lang text default 'he',
  p_marketing boolean default false, p_ads boolean default false
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_email text := nullif(btrim(coalesce(p_email, '')), '');
  v_mkt   boolean := coalesce(p_marketing, false);
  v_ads   boolean := coalesce(p_ads, false);
  v_id    uuid;
begin
  if v_phone like '972%' then v_phone := '0' || substr(v_phone, 4); end if;
  if v_phone !~ '^0[2-9][0-9]{7,8}$' then raise exception 'invalid_phone' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_name, ''))) < 2 then raise exception 'invalid_name' using errcode = '22023'; end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email' using errcode = '22023'; end if;

  if (select count(*) from contact_messages where phone = v_phone and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'too_many' using errcode = 'P0429';
  end if;

  insert into contact_messages (name, phone, email, business, topic, message, lang,
    marketing_opt_in, marketing_opt_in_at, ads_audience_opt_in, ads_audience_opt_in_at, opt_in_source)
  values (
    btrim(p_name), v_phone, v_email,
    nullif(btrim(coalesce(p_business, '')), ''),
    case when p_topic in ('website','booking','store','app','existing') then p_topic else 'unsure' end,
    nullif(btrim(coalesce(p_message, '')), ''),
    case when p_lang = 'en' then 'en' else 'he' end,
    v_mkt, case when v_mkt then now() end,
    v_ads, case when v_ads then now() end,
    case when v_mkt or v_ads then 'contact-form' end
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function contact_create(text, text, text, text, text, text, text, boolean, boolean) from public;
grant execute on function contact_create(text, text, text, text, text, text, text, boolean, boolean) to anon, authenticated;

drop function if exists booking_create(text, timestamptz, text, text, text, text, text, text, text);
create or replace function booking_create(
  p_service text, p_start timestamptz, p_name text, p_phone text,
  p_email text default null, p_business text default null,
  p_meeting text default 'phone', p_note text default null, p_lang text default 'he',
  p_marketing boolean default false, p_ads boolean default false
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_minutes int;
  v_end     timestamptz;
  v_local   timestamp;
  v_hours   booking_hours%rowtype;
  v_mkt     boolean := coalesce(p_marketing, false);
  v_ads     boolean := coalesce(p_ads, false);
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

  insert into bookings (service_id, start_at, end_at, name, phone, email, business, meeting, note, lang,
    marketing_opt_in, marketing_opt_in_at, ads_audience_opt_in, ads_audience_opt_in_at, opt_in_source)
  values (
    p_service, p_start, v_end,
    btrim(p_name), regexp_replace(p_phone, '\D', '', 'g'),
    nullif(btrim(coalesce(p_email, '')), ''), nullif(btrim(coalesce(p_business, '')), ''),
    coalesce(p_meeting, 'phone'), nullif(btrim(coalesce(p_note, '')), ''),
    case when p_lang = 'en' then 'en' else 'he' end,
    v_mkt, case when v_mkt then now() end,
    v_ads, case when v_ads then now() end,
    case when v_mkt or v_ads then 'booking' end
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function booking_create(text, timestamptz, text, text, text, text, text, text, text, boolean, boolean) from public;
grant execute on function booking_create(text, timestamptz, text, text, text, text, text, text, text, boolean, boolean) to anon, authenticated;
