-- Let TPOs edit student_profiles directly (needed for the Student Records grid).

create policy "student_profiles_update_tpo" on public.student_profiles
  for update using (public.is_tpo()) with check (public.is_tpo());
