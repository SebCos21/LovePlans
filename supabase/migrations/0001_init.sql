-- LovePlans · esquema inicial
-- Pégalo completo en Supabase → SQL Editor → New query → Run.
-- Requiere que las tablas estén vacías (proyecto nuevo).

create extension if not exists pgcrypto;

/* ------------------------------------------------------------------ */
/* Tablas                                                              */
/* ------------------------------------------------------------------ */

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Sin nombre',
  avatar_path text,
  created_at timestamptz not null default now()
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Nuestro espacio',
  anniversary date default current_date,
  couple_photo_path text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.space_members (
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  notify_new_plan boolean not null default true,
  remind_day_before boolean not null default true,
  primary key (space_id, user_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  code text not null unique,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references public.profiles (id)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 120),
  plan_date date,
  place text,
  category text not null default 'especial'
    check (category in ('comida', 'viaje', 'cine', 'aventura', 'casa', 'especial')),
  notes text,
  is_favorite boolean not null default false,
  is_done boolean not null default false,
  done_at timestamptz,
  created_by uuid not null references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plan_photos (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  storage_path text not null,
  width int,
  height int,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index plans_space_date_idx on public.plans (space_id, plan_date);
create index plan_photos_plan_idx on public.plan_photos (plan_id);
create index invitations_space_idx on public.invitations (space_id);
create index space_members_user_idx on public.space_members (user_id);
-- v1: una persona pertenece a un solo espacio de pareja
create unique index space_members_one_per_user on public.space_members (user_id);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

create or replace function public.is_space_member(p_space uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_members
    where space_id = p_space and user_id = auth.uid()
  );
$$;

create or replace function public.shares_space_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_members me
    join public.space_members them on them.space_id = me.space_id
    where me.user_id = auth.uid() and them.user_id = p_user
  );
$$;

create or replace function public.storage_space_id(p_name text)
returns uuid
language plpgsql
immutable
as $$
begin
  return split_part(p_name, '/', 1)::uuid;
exception when others then
  return null;
end;
$$;

/* ------------------------------------------------------------------ */
/* Triggers                                                            */
/* ------------------------------------------------------------------ */

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Sin nombre'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.tg_max_two_members()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.space_members where space_id = new.space_id) >= 2 then
    raise exception 'SPACE_FULL';
  end if;
  return new;
end;
$$;

drop trigger if exists max_two_members on public.space_members;
create trigger max_two_members
before insert on public.space_members
for each row execute function public.tg_max_two_members();

create or replace function public.tg_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists plans_touch_updated_at on public.plans;
create trigger plans_touch_updated_at
before update on public.plans
for each row execute function public.tg_touch_updated_at();

create or replace function public.tg_check_photo_space()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.plans where id = new.plan_id and space_id = new.space_id
  ) then
    raise exception 'PHOTO_SPACE_MISMATCH';
  end if;
  return new;
end;
$$;

drop trigger if exists plan_photos_check_space on public.plan_photos;
create trigger plan_photos_check_space
before insert on public.plan_photos
for each row execute function public.tg_check_photo_space();

/* ------------------------------------------------------------------ */
/* Códigos e invitaciones                                              */
/* ------------------------------------------------------------------ */

create or replace function public.new_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.ensure_invitation(p_space uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_space_member(p_space) then
    raise exception 'NOT_MEMBER';
  end if;

  select code into v_code
  from public.invitations
  where space_id = p_space
    and accepted_at is null
    and expires_at > now()
  order by created_at desc
  limit 1;

  if v_code is not null then
    return v_code;
  end if;

  loop
    v_code := public.new_invite_code();
    begin
      insert into public.invitations (space_id, code, created_by)
      values (p_space, v_code, auth.uid());
      return v_code;
    exception when unique_violation then
      -- código repetido: intentar otro
    end;
  end loop;
end;
$$;

create or replace function public.create_space(p_title text default 'Nuestro espacio')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_space uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if exists (select 1 from public.space_members where user_id = auth.uid()) then
    raise exception 'ALREADY_IN_SPACE';
  end if;

  insert into public.spaces (title, anniversary, created_by)
  values (coalesce(nullif(btrim(p_title), ''), 'Nuestro espacio'), current_date, auth.uid())
  returning id into v_space;

  insert into public.space_members (space_id, user_id)
  values (v_space, auth.uid());

  perform public.ensure_invitation(v_space);

  return v_space;
end;
$$;

create or replace function public.preview_invitation(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'valid', (i.accepted_at is null and i.expires_at > now()),
    'space_title', s.title,
    'inviter_name', p.display_name
  )
  from public.invitations i
  join public.spaces s on s.id = i.space_id
  join public.profiles p on p.id = i.created_by
  where i.code = upper(btrim(p_code));
$$;

create or replace function public.accept_invitation(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invitations;
  v_count int;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_inv
  from public.invitations
  where code = upper(btrim(p_code))
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'INVITE_INVALID';
  end if;

  if exists (
    select 1 from public.space_members
    where space_id = v_inv.space_id and user_id = auth.uid()
  ) then
    return v_inv.space_id;
  end if;

  if exists (
    select 1 from public.space_members
    where user_id = auth.uid() and space_id <> v_inv.space_id
  ) then
    raise exception 'ALREADY_IN_SPACE';
  end if;

  -- Serializa aceptaciones simultáneas para respetar el máximo de 2.
  perform 1 from public.spaces where id = v_inv.space_id for update;

  select count(*) into v_count
  from public.space_members
  where space_id = v_inv.space_id;

  if v_count >= 2 then
    raise exception 'SPACE_FULL';
  end if;

  insert into public.space_members (space_id, user_id)
  values (v_inv.space_id, auth.uid());

  update public.invitations
  set accepted_at = now(), accepted_by = auth.uid()
  where id = v_inv.id;

  return v_inv.space_id;
end;
$$;

create or replace function public.set_member_avatar(p_user uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.shares_space_with(p_user) then
    raise exception 'NOT_MEMBER';
  end if;

  update public.profiles set avatar_path = p_path where id = p_user;
end;
$$;

create or replace function public.ping()
returns text
language sql
as $$
  select 'ok'::text;
$$;

/* ------------------------------------------------------------------ */
/* Row Level Security                                                  */
/* ------------------------------------------------------------------ */

alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.invitations enable row level security;
alter table public.plans enable row level security;
alter table public.plan_photos enable row level security;

-- Perfiles
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.shares_space_with(id));

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Espacios
create policy spaces_select on public.spaces
  for select to authenticated
  using (public.is_space_member(id));

create policy spaces_update on public.spaces
  for update to authenticated
  using (public.is_space_member(id))
  with check (public.is_space_member(id));

-- Miembros
create policy members_select on public.space_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_space_member(space_id));

create policy members_update on public.space_members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_space_member(space_id));

create policy members_delete on public.space_members
  for delete to authenticated
  using (user_id = auth.uid());

-- Invitaciones (solo lectura para miembros; se crean por RPC)
create policy invitations_select on public.invitations
  for select to authenticated
  using (public.is_space_member(space_id));

-- Planes
create policy plans_select on public.plans
  for select to authenticated
  using (public.is_space_member(space_id));

create policy plans_insert on public.plans
  for insert to authenticated
  with check (public.is_space_member(space_id) and created_by = auth.uid());

create policy plans_update on public.plans
  for update to authenticated
  using (public.is_space_member(space_id))
  with check (public.is_space_member(space_id));

create policy plans_delete on public.plans
  for delete to authenticated
  using (public.is_space_member(space_id));

-- Fotos
create policy plan_photos_select on public.plan_photos
  for select to authenticated
  using (public.is_space_member(space_id));

create policy plan_photos_insert on public.plan_photos
  for insert to authenticated
  with check (public.is_space_member(space_id) and created_by = auth.uid());

create policy plan_photos_delete on public.plan_photos
  for delete to authenticated
  using (public.is_space_member(space_id));

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

insert into storage.buckets (id, name, public)
values ('plan-photos', 'plan-photos', false), ('space-media', 'space-media', false)
on conflict (id) do nothing;

create policy "plan photos read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'plan-photos'
    and public.is_space_member(public.storage_space_id(name))
  );

create policy "plan photos write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'plan-photos'
    and owner = auth.uid()
    and public.is_space_member(public.storage_space_id(name))
  );

create policy "plan photos delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'plan-photos'
    and public.is_space_member(public.storage_space_id(name))
  );

create policy "space media read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'space-media'
    and public.is_space_member(public.storage_space_id(name))
  );

create policy "space media write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'space-media'
    and owner = auth.uid()
    and public.is_space_member(public.storage_space_id(name))
  );

create policy "space media update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'space-media'
    and public.is_space_member(public.storage_space_id(name))
  )
  with check (
    bucket_id = 'space-media'
    and public.is_space_member(public.storage_space_id(name))
  );

create policy "space media delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'space-media'
    and public.is_space_member(public.storage_space_id(name))
  );

/* ------------------------------------------------------------------ */
/* Realtime                                                            */
/* ------------------------------------------------------------------ */

alter table public.plans replica identity full;
alter table public.plan_photos replica identity full;
alter table public.spaces replica identity full;
alter table public.space_members replica identity full;

alter publication supabase_realtime add table
  public.plans,
  public.plan_photos,
  public.spaces,
  public.space_members,
  public.profiles;

/* ------------------------------------------------------------------ */
/* Permisos de funciones                                               */
/* ------------------------------------------------------------------ */

revoke all on function public.create_space(text) from public;
revoke all on function public.ensure_invitation(uuid) from public;
revoke all on function public.preview_invitation(text) from public;
revoke all on function public.accept_invitation(text) from public;
revoke all on function public.set_member_avatar(uuid, text) from public;

grant execute on function public.create_space(text) to authenticated;
grant execute on function public.ensure_invitation(uuid) to authenticated;
grant execute on function public.preview_invitation(text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.set_member_avatar(uuid, text) to authenticated;
grant execute on function public.is_space_member(uuid) to authenticated;
grant execute on function public.shares_space_with(uuid) to authenticated;
grant execute on function public.storage_space_id(text) to authenticated;
grant execute on function public.ping() to anon, authenticated;
