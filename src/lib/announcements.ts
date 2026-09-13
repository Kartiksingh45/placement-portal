import { supabase } from './supabase'
import type { Announcement } from '../types/database'

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Announcement[]
}

export async function createAnnouncement(input: {
  message: string
  targetType: 'all' | 'student'
  targetStudentId: string | null
  createdBy: string
}): Promise<Announcement> {
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      message: input.message,
      target_type: input.targetType,
      target_student_id: input.targetType === 'student' ? input.targetStudentId : null,
      created_by: input.createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return data as Announcement
}
