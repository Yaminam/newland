begin;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  feedback_type text not null,
  message text,
  page_url text not null,
  created_at timestamptz not null default now(),
  constraint feedback_type_check check (feedback_type in ('positive', 'neutral', 'negative'))
);

alter table if exists public.feedback
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists mood text,
  add column if not exists feedback_type text,
  add column if not exists message text,
  add column if not exists page_url text,
  add column if not exists created_at timestamptz default now();

alter table if exists public.feedback
  drop constraint if exists feedback_user_id_fkey;

alter table if exists public.feedback
  add constraint feedback_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

update public.feedback
set feedback_type = coalesce(
      nullif(feedback_type, ''),
      case
        when mood is null then null
        when mood::text in ('positive', '1') then 'positive'
        when mood::text in ('neutral', '0', '2') then 'neutral'
        when mood::text in ('negative', '-1', '3') then 'negative'
        else 'neutral'
      end
    ),
    created_at = coalesce(created_at, now())
where feedback_type is null
   or feedback_type = ''
   or created_at is null;

alter table if exists public.feedback
  alter column user_id drop not null,
  alter column mood drop not null,
  alter column feedback_type set not null,
  alter column page_url set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

alter table if exists public.feedback
  drop constraint if exists feedback_type_check;

alter table if exists public.feedback
  add constraint feedback_type_check check (feedback_type in ('positive', 'neutral', 'negative'));

create index if not exists feedback_user_id_idx
  on public.feedback (user_id);

create index if not exists feedback_type_created_at_idx
  on public.feedback (feedback_type, created_at desc);

alter table if exists public.feedback enable row level security;

grant insert, select on table public.feedback to authenticated, anon;

drop policy if exists "Users can insert own feedback" on public.feedback;
drop policy if exists "Anonymous users can insert feedback" on public.feedback;
drop policy if exists "Users can read own feedback" on public.feedback;
drop policy if exists "Admins can read all feedback" on public.feedback;

create policy "Users can insert own feedback"
  on public.feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Anonymous users can insert feedback"
  on public.feedback for insert
  to anon
  with check (user_id is null);

create policy "Users can read own feedback"
  on public.feedback for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can read all feedback"
  on public.feedback for select
  to authenticated
  using (public.current_access_role() = 'admin');

commit;
