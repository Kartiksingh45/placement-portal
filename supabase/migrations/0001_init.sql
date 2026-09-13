-- Smart Campus & Placement Portal — initial schema, RBAC, RLS
-- Run this once in the Supabase SQL editor (or `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type user_role as enum ('student', 'tpo');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'student',
  full_name text not null default '',
  email text not null,
  created_at timestamptz not null default now()
);

create table public.student_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  branch text,
  batch_year int,
  cgpa numeric(4, 2),
  phone text,
  skills text[] not null default '{}',
  certifications text[] not null default '{}',
  resume_url text,
  resume_parsed jsonb,
  resume_status text not null default 'not_uploaded',
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  website text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.drives (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  role_title text not null,
  description text,
  min_cgpa numeric(4, 2) not null default 0,
  eligible_branches text[] not null default '{}',
  required_skills text[] not null default '{}',
  required_certifications text[] not null default '{}',
  deadline timestamptz,
  status text not null default 'open',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid not null references public.drives (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'applied',
  match_score numeric(5, 2),
  applied_at timestamptz not null default now(),
  unique (drive_id, student_id)
);

create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  drive_id uuid references public.drives (id),
  status text not null default 'in_progress',
  overall_score numeric(5, 2),
  feedback_summary text,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table public.interview_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  order_index int not null,
  question text not null,
  answer text,
  score numeric(5, 2),
  feedback text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up.
-- Client passes role/full_name via supabase.auth.signUp({ options: { data: {...} } }).
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RBAC helper (security definer avoids recursive RLS on profiles)
-- ---------------------------------------------------------------------------

create function public.is_tpo()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'tpo'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.companies enable row level security;
alter table public.drives enable row level security;
alter table public.applications enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_turns enable row level security;

-- profiles
create policy "profiles_select_self_or_tpo" on public.profiles
  for select using (id = auth.uid() or public.is_tpo());

create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

-- student_profiles
create policy "student_profiles_select_self_or_tpo" on public.student_profiles
  for select using (user_id = auth.uid() or public.is_tpo());

create policy "student_profiles_insert_self" on public.student_profiles
  for insert with check (user_id = auth.uid());

create policy "student_profiles_update_self" on public.student_profiles
  for update using (user_id = auth.uid());

-- companies
create policy "companies_select_authenticated" on public.companies
  for select using (auth.role() = 'authenticated');

create policy "companies_write_tpo" on public.companies
  for all using (public.is_tpo()) with check (public.is_tpo());

-- drives
create policy "drives_select_authenticated" on public.drives
  for select using (auth.role() = 'authenticated');

create policy "drives_write_tpo" on public.drives
  for all using (public.is_tpo()) with check (public.is_tpo());

-- applications
create policy "applications_select_self_or_tpo" on public.applications
  for select using (student_id = auth.uid() or public.is_tpo());

create policy "applications_insert_self" on public.applications
  for insert with check (student_id = auth.uid());

create policy "applications_update_tpo" on public.applications
  for update using (public.is_tpo());

-- interview_sessions
create policy "interview_sessions_select_self_or_tpo" on public.interview_sessions
  for select using (student_id = auth.uid() or public.is_tpo());

create policy "interview_sessions_write_self" on public.interview_sessions
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

-- interview_turns (scoped via parent session)
create policy "interview_turns_select_self_or_tpo" on public.interview_turns
  for select using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = session_id and (s.student_id = auth.uid() or public.is_tpo())
    )
  );

create policy "interview_turns_write_self" on public.interview_turns
  for all using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = session_id and s.student_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.interview_sessions s
      where s.id = session_id and s.student_id = auth.uid()
    )
  );
