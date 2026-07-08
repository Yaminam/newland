begin;

alter table if exists public.api_keys enable row level security;

grant select, insert, update, delete on table public.api_keys to authenticated;

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
