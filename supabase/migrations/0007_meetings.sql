-- Video-call meetings tracker: a TPO schedules a Google Meet call between a
-- company's HR and a set of students (all / one branch+year / specific students).
-- The actual Meet link is created via the Google Calendar API from the
-- "create-meeting" Edge Function, using the TPO's own connected Google account
-- (refresh token stored in google_calendar_tokens, never exposed to the client).

create table public.google_calendar_tokens (
  tpo_id uuid primary key references public.profiles (id) on delete cascade,
  refresh_token text not null,
  connected_email text,
  updated_at timestamptz not null default now()
);

alter table public.google_calendar_tokens enable row level security;

-- No client-side select/update policy: only Edge Functions (service role) touch
-- this table, so the refresh_token is never readable from the browser.

-- Safe, refresh-token-free view so the TPO's own dashboard can show
-- "Connected as ___" without ever selecting from the base table.
create view public.google_calendar_connections
  with (security_invoker = on) as
  select tpo_id, connected_email, updated_at from public.google_calendar_tokens;

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 30,
  hr_name text,
  hr_email text,
  audience_type text not null default 'all' check (audience_type in ('all', 'branch', 'students')),
  branch text,
  year_of_study int,
  student_ids uuid[] not null default '{}',
  meet_link text,
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.meetings enable row level security;

create policy "meetings_select" on public.meetings
  for select using (
    public.is_tpo()
    or audience_type = 'all'
    or (audience_type = 'students' and auth.uid() = any (student_ids))
    or (
      audience_type = 'branch'
      and exists (
        select 1 from public.student_profiles sp
        where sp.user_id = auth.uid()
          and sp.branch = meetings.branch
          and (meetings.year_of_study is null or sp.year_of_study = meetings.year_of_study)
      )
    )
  );

create policy "meetings_write_tpo" on public.meetings
  for all using (public.is_tpo()) with check (public.is_tpo());
