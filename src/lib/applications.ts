import { supabase } from './supabase'
import type { Application } from '../types/database'

export interface ApplicationWithStudent extends Application {
  profiles: { full_name: string; email: string } | null
}

export async function fetchMyApplications(studentId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('student_id', studentId)
  if (error) throw error
  return (data ?? []) as Application[]
}

export async function applyToDrive(
  driveId: string,
  studentId: string,
  matchScore: number,
): Promise<Application> {
  const { data, error } = await supabase
    .from('applications')
    .insert({ drive_id: driveId, student_id: studentId, match_score: matchScore })
    .select()
    .single()
  if (error) throw error
  return data as Application
}

export async function fetchApplicationsForDrive(driveId: string): Promise<ApplicationWithStudent[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*, profiles(full_name, email)')
    .eq('drive_id', driveId)
    .order('match_score', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ApplicationWithStudent[]
}

export async function updateApplicationStatus(
  id: string,
  status: Application['status'],
): Promise<void> {
  const { error } = await supabase.from('applications').update({ status }).eq('id', id)
  if (error) throw error
}
