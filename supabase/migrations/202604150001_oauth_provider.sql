begin;

alter table if exists public.profiles
  add column if not exists email text,
  add column if not exists avatar_url text,
  add column if not exists onboarding_completed boolean default false,
  add column if not exists updated_at timestamptz default now();

alter table if exists public.profiles
  alter column first_name drop not null,
  alter column last_name drop not null,
  alter column company drop not null,
  alter column role drop not null,
  alter column onboarding_completed set default false;

create or replace function public.handle_oauth_profile_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := trim(coalesce(metadata->>'full_name', metadata->>'name', ''));
  derived_first_name text := nullif(trim(coalesce(metadata->>'first_name', split_part(full_name, ' ', 1))), '');
  derived_last_name text := nullif(
    trim(
      coalesce(
        metadata->>'last_name',
        case
          when full_name <> '' and strpos(full_name, ' ') > 0
            then substr(full_name, strpos(full_name, ' ') + 1)
          else ''
        end
      )
    ),
    ''
  );
  derived_avatar_url text := nullif(coalesce(metadata->>'avatar_url', metadata->>'picture', metadata->>'avatar'), '');
begin
  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    avatar_url,
    onboarding_completed,
    updated_at
  )
  values (
    new.id,
    new.email,
    derived_first_name,
    derived_last_name,
    derived_avatar_url,
    false,
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        first_name = coalesce(public.profiles.first_name, excluded.first_name),
        last_name = coalesce(public.profiles.last_name, excluded.last_name),
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_oauth_profile_sync on auth.users;

create trigger on_auth_user_oauth_profile_sync
after insert or update of raw_user_meta_data, email on auth.users
for each row
execute function public.handle_oauth_profile_sync();

update public.profiles p
set
  email = coalesce(p.email, u.email),
  first_name = coalesce(
    nullif(p.first_name, ''),
    nullif(trim(coalesce(u.raw_user_meta_data->>'first_name', split_part(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ', 1))), '')
  ),
  last_name = coalesce(
    nullif(p.last_name, ''),
    nullif(
      trim(
        coalesce(
          u.raw_user_meta_data->>'last_name',
          case
            when coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '') <> ''
              and strpos(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ') > 0
            then substr(
              coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
              strpos(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), ' ') + 1
            )
            else ''
          end
        )
      ),
      ''
    )
  ),
  avatar_url = coalesce(
    nullif(p.avatar_url, ''),
    nullif(coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', u.raw_user_meta_data->>'avatar'), '')
  ),
  onboarding_completed = coalesce(p.onboarding_completed, false),
  updated_at = now()
from auth.users u
where p.id = u.id;

commit;
