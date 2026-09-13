-- Per-company, per-branch ordered student lists for the TPO "Arrange Students" tool.

create table public.student_sequences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  branch text not null,
  student_order uuid[] not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id),
  unique (company_id, branch)
);

alter table public.student_sequences add constraint student_sequences_branch_check
  check (
    branch in (
      'Computer Science Engineering',
      'Artificial Intelligence Engineering',
      'Robotics and Automation Engineering',
      'Civil Engineering',
      'Mechanical Engineering',
      'Electrical Engineering',
      'Electronics Engineering',
      'Chemical Engineering'
    )
  );

alter table public.student_sequences enable row level security;

create policy "student_sequences_all_tpo" on public.student_sequences
  for all using (public.is_tpo()) with check (public.is_tpo());
