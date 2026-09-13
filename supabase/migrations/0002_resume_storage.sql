-- Resume storage bucket + RLS for the ATS-parsing milestone.
-- Run this once in the Supabase SQL editor, after 0001_init.sql.

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false);

-- path convention: resumes/{user_id}/resume.pdf
create policy "resumes_student_rw" on storage.objects
  for all using (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "resumes_tpo_read" on storage.objects
  for select using (
    bucket_id = 'resumes' and public.is_tpo()
  );
