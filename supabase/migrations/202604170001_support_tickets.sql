begin;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint support_tickets_status_check check (status in ('open', 'in_progress', 'resolved'))
);

alter table if exists public.support_tickets
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists subject text,
  add column if not exists message text,
  add column if not exists status text default 'open',
  add column if not exists created_at timestamptz default now();

alter table if exists public.support_tickets
  drop constraint if exists support_tickets_user_id_fkey;

alter table if exists public.support_tickets
  add constraint support_tickets_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

update public.support_tickets
set status = coalesce(nullif(status, ''), 'open'),
    created_at = coalesce(created_at, now())
where status is null
   or status = ''
   or created_at is null;

alter table if exists public.support_tickets
  alter column name set not null,
  alter column email set not null,
  alter column subject set not null,
  alter column message set not null,
  alter column status set default 'open',
  alter column status set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

alter table if exists public.support_tickets
  drop constraint if exists support_tickets_status_check;

alter table if exists public.support_tickets
  add constraint support_tickets_status_check check (status in ('open', 'in_progress', 'resolved'));

create index if not exists support_tickets_user_id_idx
  on public.support_tickets (user_id);

create index if not exists support_tickets_status_created_at_idx
  on public.support_tickets (status, created_at desc);

alter table if exists public.support_tickets enable row level security;

grant insert on table public.support_tickets to anon;
grant select, insert on table public.support_tickets to authenticated;
grant update on table public.support_tickets to authenticated;

drop policy if exists "Anonymous users can create support tickets" on public.support_tickets;
drop policy if exists "Users can insert own support tickets" on public.support_tickets;
drop policy if exists "Users can read own support tickets" on public.support_tickets;
drop policy if exists "Admins can read all support tickets" on public.support_tickets;
drop policy if exists "Admins can update all support tickets" on public.support_tickets;

create policy "Anonymous users can create support tickets"
  on public.support_tickets for insert
  to anon
  with check (user_id is null);

create policy "Users can insert own support tickets"
  on public.support_tickets for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read own support tickets"
  on public.support_tickets for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can read all support tickets"
  on public.support_tickets for select
  to authenticated
  using (public.current_access_role() = 'admin');

create policy "Admins can update all support tickets"
  on public.support_tickets for update
  to authenticated
  using (public.current_access_role() = 'admin')
  with check (public.current_access_role() = 'admin');

commit;
