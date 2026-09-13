-- Student self-signup verification: account approval workflow + extra student details.

-- ---------------------------------------------------------------------------
-- profiles: approval status
-- ---------------------------------------------------------------------------

alter table public.profiles add column status text not null default 'pending';
alter table public.profiles add constraint profiles_status_check
  check (status in ('pending', 'approved', 'rejected'));

-- Grandfather in accounts that already existed before this migration.
update public.profiles set status = 'approved';

-- ---------------------------------------------------------------------------
-- student_profiles: college name, roll no, year of study
-- ---------------------------------------------------------------------------

alter table public.student_profiles add column college_name text;
alter table public.student_profiles add column roll_no text;
alter table public.student_profiles add column year_of_study int;

alter table public.student_profiles add constraint student_profiles_year_check
  check (year_of_study is null or year_of_study between 1 and 4);

alter table public.student_profiles add constraint student_profiles_branch_check
  check (
    branch is null or branch in (
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

-- ---------------------------------------------------------------------------
-- Sign-up trigger: students start out 'pending' (need TPO approval); also
-- seed their student_profiles row from the extra signup fields.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role user_role;
begin
  new_role := coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'student');

  insert into public.profiles (id, role, full_name, email, status)
  values (
    new.id,
    new_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    case when new_role = 'tpo' then 'approved' else 'pending' end
  );

  if new_role = 'student' then
    insert into public.student_profiles (user_id, branch, college_name, roll_no, year_of_study)
    values (
      new.id,
      new.raw_user_meta_data ->> 'branch',
      new.raw_user_meta_data ->> 'college_name',
      new.raw_user_meta_data ->> 'roll_no',
      nullif(new.raw_user_meta_data ->> 'year_of_study', '')::int
    );
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Prevent students from approving themselves or changing their own role by
-- writing directly to their profile row.
-- ---------------------------------------------------------------------------

create function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_tpo() then
    new.status := old.status;
    new.role := old.role;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_admin_fields
  before update on public.profiles
  for each row execute function public.protect_profile_admin_fields();

-- Let TPOs approve/reject any student's profile.
create policy "profiles_update_tpo" on public.profiles
  for update using (public.is_tpo()) with check (public.is_tpo());
