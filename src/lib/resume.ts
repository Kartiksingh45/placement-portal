import { supabase } from './supabase'
import type { StudentProfile } from '../types/database'

export const RESUME_BUCKET = 'resumes'

export function resumePath(userId: string) {
  return `${userId}/resume.pdf`
}

export async function fetchStudentProfile(userId: string): Promise<StudentProfile | null> {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as StudentProfile | null
}

export async function uploadResume(userId: string, file: File) {
  const path = resumePath(userId)
  const { error } = await supabase.storage.from(RESUME_BUCKET).upload(path, file, {
    upsert: true,
    contentType: 'application/pdf',
  })
  if (error) throw error
  return path
}

export async function parseResume(path: string): Promise<StudentProfile> {
  const { data, error } = await supabase.functions.invoke<{
    data?: StudentProfile
    error?: string
  }>('parse-resume', {
    body: { path },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)
  if (!data?.data) throw new Error('No data returned from parse-resume')
  return data.data
}
