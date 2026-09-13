-- Placement updates / announcements: TPO can post to all students or one specific student.
-- Run this once in the Supabase SQL editor, after 0001_init.sql and 0002_resume_storage.sql.

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  target_type text not null check (target_type in ('all', 'student')),
  target_student_id uuid references public.profiles (id) on delete cascade,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint target_student_required check (
    (target_type = 'student' and target_student_id is not null) or
    (target_type = 'all' and target_student_id is null)
  )
);

alter table public.announcements enable row level security;

create policy "announcements_select" on public.announcements
  for select using (
    public.is_tpo() or target_type = 'all' or target_student_id = auth.uid()
  );

create policy "announcements_write_tpo" on public.announcements
  for all using (public.is_tpo()) with check (public.is_tpo());
