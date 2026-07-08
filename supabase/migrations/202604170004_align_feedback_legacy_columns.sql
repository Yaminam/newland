begin;

alter table if exists public.feedback
  add column if not exists mood text,
  add column if not exists feedback_type text;

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
    )
where feedback_type is null
   or feedback_type = '';

alter table if exists public.feedback
  alter column mood drop not null,
  alter column feedback_type set not null;

commit;
