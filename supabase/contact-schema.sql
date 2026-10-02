-- Bonim Digital — contact form messages (the "פניות" page in /admin/)
-- Run in the Supabase SQL editor AFTER booking-schema.sql (it reuses booking_admins / is_booking_admin()).

create table if not exists contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  phone       text not null check (phone ~ '^0[2-9][0-9]{7,8}$'),
  email       text check (email is null or char_length(email) <= 120),
  business    text check (business is null or char_length(business) <= 120),
  topic       text not null default 'unsure' check (topic in ('website','booking','store','app','existing','unsure')),
  message     text check (message is null or char_length(message) <= 2000),
  lang        text not null default 'he' check (lang in ('he','en')),
  status      text not null default 'new' check (status in ('new','in_progress','done','spam')),
  admin_note  text,
  created_at  timestamptz not null default now()
);

create index if not exists contact_messages_created_idx on contact_messages (created_at desc);
create index if not exists contact_messages_phone_idx on contact_messages (phone, created_at desc);

alter table contact_messages enable row level security;

drop policy if exists contact_admin_select on contact_messages;
drop policy if exists contact_admin_update on contact_messages;
drop policy if exists contact_admin_delete on contact_messages;
create policy contact_admin_select on contact_messages for select to authenticated using (is_booking_admin());
create policy contact_admin_update on contact_messages for update to authenticated using (is_booking_admin()) with check (is_booking_admin());
create policy contact_admin_delete on contact_messages for delete to authenticated using (is_booking_admin());

-- Public side can only call this validated insert; it never reads the table.
create or replace function contact_create(
  p_name text, p_phone text, p_email text default null, p_business text default null,
  p_topic text default 'unsure', p_message text default null, p_lang text default 'he'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_email text := nullif(btrim(coalesce(p_email, '')), '');
  v_id    uuid;
begin
  if v_phone like '972%' then v_phone := '0' || substr(v_phone, 4); end if;
  if v_phone !~ '^0[2-9][0-9]{7,8}$' then raise exception 'invalid_phone' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_name, ''))) < 2 then raise exception 'invalid_name' using errcode = '22023'; end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email' using errcode = '22023'; end if;

  if (select count(*) from contact_messages where phone = v_phone and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'too_many' using errcode = 'P0429';
  end if;

  insert into contact_messages (name, phone, email, business, topic, message, lang)
  values (
    btrim(p_name), v_phone, v_email,
    nullif(btrim(coalesce(p_business, '')), ''),
    case when p_topic in ('website','booking','store','app','existing') then p_topic else 'unsure' end,
    nullif(btrim(coalesce(p_message, '')), ''),
    case when p_lang = 'en' then 'en' else 'he' end
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function contact_create(text, text, text, text, text, text, text) from public;
grant execute on function contact_create(text, text, text, text, text, text, text) to anon, authenticated;
