import { supabase } from './supabase'
import type { Profile, ProfileStatus, StudentProfile } from '../types/database'

export interface StudentDirectoryEntry {
  profile: Profile
  studentProfile: StudentProfile | null
}

export async function fetchAllStudents(): Promise<StudentDirectoryEntry[]> {
  const [{ data: profiles, error: profilesError }, { data: studentProfiles, error: spError }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'student').order('full_name'),
      supabase.from('student_profiles').select('*'),
    ])

  if (profilesError) throw profilesError
  if (spError) throw spError

  const spMap = new Map(
    (studentProfiles ?? []).map((sp) => [sp.user_id as string, sp as StudentProfile]),
  )

  return (profiles ?? []).map((p) => ({
    profile: p as Profile,
    studentProfile: spMap.get(p.id) ?? null,
  }))
}

export async function setStudentStatus(studentId: string, status: ProfileStatus) {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', studentId)
  if (error) throw error
}

export async function updateStudentPhone(studentId: string, phone: string) {
  const { error } = await supabase
    .from('student_profiles')
    .update({ phone: phone || null, updated_at: new Date().toISOString() })
    .eq('user_id', studentId)
  if (error) throw error
}

export interface StudentDetailsInput {
  collegeName: string
  rollNo: string
  branch: string
  yearOfStudy: number | null
  phone: string
}

export async function updateStudentDetails(studentId: string, details: StudentDetailsInput) {
  const { error } = await supabase
    .from('student_profiles')
    .update({
      college_name: details.collegeName || null,
      roll_no: details.rollNo || null,
      branch: details.branch || null,
      year_of_study: details.yearOfStudy,
      phone: details.phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', studentId)
  if (error) throw error
}

export async function updateStudentEmail(studentId: string, newEmail: string): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke<{ link: string | null }>(
    'update-student-email',
    {
      body: {
        studentId,
        newEmail,
        redirectTo: `${window.location.origin}/reset-password`,
      },
    },
  )
  if (error) throw error
  return data?.link ?? null
}
