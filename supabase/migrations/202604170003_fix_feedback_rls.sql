begin;

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
