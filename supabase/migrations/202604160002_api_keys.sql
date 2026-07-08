begin;

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  is_active boolean not null default true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table if exists public.api_keys
  drop constraint if exists api_keys_user_id_fkey;

alter table if exists public.api_keys
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists name text,
  add column if not exists key_hash text,
  add column if not exists key_prefix text,
  add column if not exists is_active boolean default true,
  add column if not exists last_used_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists revoked_at timestamptz;

alter table if exists public.api_keys
  add constraint api_keys_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

update public.api_keys
set is_active = coalesce(is_active, true),
    created_at = coalesce(created_at, now())
where is_active is null
   or created_at is null;

alter table if exists public.api_keys
  alter column is_active set default true,
  alter column created_at set default now(),
  alter column user_id set not null,
  alter column name set not null,
  alter column key_hash set not null,
  alter column key_prefix set not null,
  alter column is_active set not null,
  alter column created_at set not null;

create unique index if not exists api_keys_key_hash_key
  on public.api_keys (key_hash);

create index if not exists api_keys_user_id_idx
  on public.api_keys (user_id);

create index if not exists api_keys_active_idx
  on public.api_keys (user_id, is_active);

alter table if exists public.api_keys enable row level security;

drop policy if exists "Users can read own api keys" on public.api_keys;
drop policy if exists "Users can insert own api keys" on public.api_keys;
drop policy if exists "Users can update own api keys" on public.api_keys;
drop policy if exists "Users can delete own api keys" on public.api_keys;
drop policy if exists "Admins can read all api keys" on public.api_keys;
drop policy if exists api_keys_owner_select on public.api_keys;
drop policy if exists api_keys_owner_insert on public.api_keys;
drop policy if exists api_keys_owner_update on public.api_keys;
drop policy if exists api_keys_owner_delete on public.api_keys;
drop policy if exists api_keys_admin_select on public.api_keys;

create policy "Users can read own api keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert own api keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can update own api keys"
  on public.api_keys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own api keys"
  on public.api_keys for delete
  using (auth.uid() = user_id);

create policy "Admins can read all api keys"
  on public.api_keys for select
  using (public.current_access_role() = 'admin');

commit;
