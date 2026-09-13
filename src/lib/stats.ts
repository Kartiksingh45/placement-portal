import { supabase } from './supabase'

export async function countStudents(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
  if (error) throw error
  return count ?? 0
}

export async function countActiveDrives(): Promise<number> {
  const { count, error } = await supabase
    .from('drives')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
  if (error) throw error
  return count ?? 0
}

export async function countAllApplications(): Promise<number> {
  const { count, error } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

export async function countMyApplications(studentId: string): Promise<number> {
  const { count, error } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
  if (error) throw error
  return count ?? 0
}
