-- Ownership enforcement for user-scoped tables.
-- Apply this migration in Supabase so forged requests with another user's IDs
-- are rejected by Postgres even if a client bypasses frontend checks.

begin;

alter table if exists public.profiles enable row level security;
alter table if exists public.investor_profiles enable row level security;
alter table if exists public.founder_profiles enable row level security;
alter table if exists public.onboarding_data enable row level security;
alter table if exists public.deals enable row level security;
alter table if exists public.portfolio_items enable row level security;
alter table if exists public.notifications enable row level security;
alter table if exists public.founder_bookmarks enable row level security;
alter table if exists public.introductions enable row level security;
alter table if exists public.founder_intro_requests enable row level security;
alter table if exists public.event_rsvps enable row level security;

do $$
begin
  create policy profiles_owner_select
    on public.profiles for select
    using (id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy profiles_owner_update
    on public.profiles for update
    using (id = auth.uid())
    with check (id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy investor_profiles_owner_all
    on public.investor_profiles for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy founder_profiles_owner_all
    on public.founder_profiles for all
    using (profile_id = auth.uid())
    with check (profile_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy onboarding_data_owner_all
    on public.onboarding_data for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy deals_owner_all
    on public.deals for all
    using (investor_id = auth.uid())
    with check (investor_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy portfolio_items_owner_all
    on public.portfolio_items for all
    using (investor_id = auth.uid())
    with check (investor_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy notifications_owner_select
    on public.notifications for select
    using (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy notifications_owner_update
    on public.notifications for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy founder_bookmarks_owner_all
    on public.founder_bookmarks for all
    using (investor_id = auth.uid())
    with check (investor_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy introductions_participant_select
    on public.introductions for select
    using (investor_id = auth.uid() or founder_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy introductions_participant_insert
    on public.introductions for insert
    with check (investor_id = auth.uid() or founder_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy introductions_participant_update
    on public.introductions for update
    using (investor_id = auth.uid() or founder_id = auth.uid())
    with check (investor_id = auth.uid() or founder_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy founder_intro_requests_participant_all
    on public.founder_intro_requests for all
    using (investor_id = auth.uid() or founder_id = auth.uid())
    with check (investor_id = auth.uid() or founder_id = auth.uid());
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy event_rsvps_owner_all
    on public.event_rsvps for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null;
end $$;

create or replace function public.handle_introduction_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, type, title, body, action_url)
    values (
      new.investor_id,
      'intro_request',
      'New intro request',
      coalesce(left(new.message, 150), 'You received a new introduction request.'),
      '/dashboard/introductions'
    );
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status and new.status in ('accepted', 'declined') then
    insert into public.notifications (user_id, type, title, body, action_url)
    values (
      new.founder_id,
      case when new.status = 'accepted' then 'intro_accepted' else 'intro_declined' end,
      case when new.status = 'accepted' then 'Your intro request was accepted' else 'Your intro request was declined' end,
      case when new.status = 'accepted' then 'Your intro request was accepted. Reach out to connect.' else null end,
      '/dashboard/introductions'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists introductions_notification_trigger on public.introductions;

create trigger introductions_notification_trigger
after insert or update of status on public.introductions
for each row
execute function public.handle_introduction_notifications();

commit;
