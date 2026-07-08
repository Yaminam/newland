begin;

create table if not exists public.roles (
  id text primary key,
  description text not null,
  created_at timestamptz not null default now()
);

insert into public.roles (id, description)
values
  ('admin', 'Platform administrator with read access across profiles'),
  ('user', 'Standard user access'),
  ('team', 'Internal team member with visibility into other team profiles')
on conflict (id) do update
  set description = excluded.description;

alter table if exists public.profiles
  add column if not exists access_role text not null default 'user';

alter table if exists public.profiles
  drop constraint if exists profiles_access_role_fkey;

alter table if exists public.profiles
  add constraint profiles_access_role_fkey
  foreign key (access_role) references public.roles(id);

create or replace function public.current_access_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.access_role from public.profiles p where p.id = auth.uid() limit 1),
    'user'
  );
$$;

alter table if exists public.roles enable row level security;

do $$
begin
  create policy roles_authenticated_read
    on public.roles for select
    using (auth.role() = 'authenticated');
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy profiles_owner_insert
    on public.profiles for insert
    with check (id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy profiles_admin_select
    on public.profiles for select
    using (public.current_access_role() = 'admin');
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy profiles_team_select
    on public.profiles for select
    using (
      public.current_access_role() = 'team'
      and access_role = 'team'
    );
exception when duplicate_object then null;
end $$;

update public.profiles
set access_role = coalesce(nullif(access_role, ''), 'user')
where access_role is distinct from coalesce(nullif(access_role, ''), 'user');

commit;
