-- Public "job opportunities" news posts (TPO-authored, visible on the landing
-- page to everyone, including signed-out visitors) + resume builder/checker
-- storage on student_profiles.

create table public.job_opportunities (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  role_title text not null,
  description text not null,
  photo_url text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.job_opportunities enable row level security;

-- Anyone (including anonymous visitors on the landing page) can read these.
create policy "job_opportunities_select_public" on public.job_opportunities
  for select using (true);

create policy "job_opportunities_write_tpo" on public.job_opportunities
  for all using (public.is_tpo()) with check (public.is_tpo());

-- Public storage bucket for the photos attached to job opportunity posts.
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', true)
on conflict (id) do nothing;

create policy "job_photos_public_read" on storage.objects
  for select using (bucket_id = 'job-photos');

create policy "job_photos_tpo_write" on storage.objects
  for insert with check (bucket_id = 'job-photos' and public.is_tpo());

create policy "job_photos_tpo_update" on storage.objects
  for update using (bucket_id = 'job-photos' and public.is_tpo());

create policy "job_photos_tpo_delete" on storage.objects
  for delete using (bucket_id = 'job-photos' and public.is_tpo());

-- Resume Builder (student-authored structured resume) and Resume Checker
-- (AI score + suggestions), stored per student.
alter table public.student_profiles add column builder_resume jsonb;
alter table public.student_profiles add column resume_check jsonb;
