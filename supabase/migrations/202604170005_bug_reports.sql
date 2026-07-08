begin;

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  title text not null,
  description text not null,
  severity text not null,
  steps_to_reproduce text,
  expected_behavior text,
  actual_behavior text,
  screenshot_url text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bug_reports_severity_check check (severity in ('low', 'medium', 'high', 'critical')),
  constraint bug_reports_status_check check (status in ('open', 'in_progress', 'resolved'))
);

alter table if exists public.bug_reports
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists severity text,
  add column if not exists steps_to_reproduce text,
  add column if not exists expected_behavior text,
  add column if not exists actual_behavior text,
  add column if not exists screenshot_url text,
  add column if not exists status text default 'open',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

alter table if exists public.bug_reports
  drop constraint if exists bug_reports_user_id_fkey;

alter table if exists public.bug_reports
  add constraint bug_reports_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

update public.bug_reports
set status = coalesce(nullif(status, ''), 'open'),
    updated_at = coalesce(updated_at, now()),
    created_at = coalesce(created_at, now())
where status is null
   or status = ''
   or updated_at is null
   or created_at is null;

alter table if exists public.bug_reports
  alter column user_id drop not null,
  alter column name set not null,
  alter column email set not null,
  alter column title set not null,
  alter column description set not null,
  alter column severity set not null,
  alter column status set default 'open',
  alter column status set not null,
  alter column created_at set default now(),
  alter column created_at set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table if exists public.bug_reports
  drop constraint if exists bug_reports_severity_check,
  drop constraint if exists bug_reports_status_check;

alter table if exists public.bug_reports
  add constraint bug_reports_severity_check check (severity in ('low', 'medium', 'high', 'critical')),
  add constraint bug_reports_status_check check (status in ('open', 'in_progress', 'resolved'));

create index if not exists bug_reports_user_id_idx
  on public.bug_reports (user_id);

create index if not exists bug_reports_status_created_at_idx
  on public.bug_reports (status, created_at desc);

alter table if exists public.bug_reports enable row level security;

grant insert on table public.bug_reports to authenticated, anon;
grant select on table public.bug_reports to authenticated;
grant update, delete on table public.bug_reports to authenticated;

drop policy if exists "Anyone can insert bug reports" on public.bug_reports;
drop policy if exists "Users can read own bug reports" on public.bug_reports;
drop policy if exists "Admins can manage all bug reports" on public.bug_reports;

create policy "Anyone can insert bug reports"
  on public.bug_reports for insert
  to authenticated, anon
  with check (true);

create policy "Users can read own bug reports"
  on public.bug_reports for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can manage all bug reports"
  on public.bug_reports for all
  to authenticated
  using (public.current_access_role() = 'admin')
  with check (public.current_access_role() = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bug-screenshots',
  'bug-screenshots',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload bug screenshots" on storage.objects;
drop policy if exists "Public can view bug screenshots" on storage.objects;

create policy "Anyone can upload bug screenshots"
  on storage.objects for insert
  to authenticated, anon
  with check (bucket_id = 'bug-screenshots');

create policy "Public can view bug screenshots"
  on storage.objects for select
  to public
  using (bucket_id = 'bug-screenshots');

commit;
