import { supabase } from './supabase'
import type { Meeting } from '../types/database'

export interface CreateMeetingInput {
  companyId: string
  title: string
  scheduledAt: string
  durationMinutes: number
  hrName: string
  hrEmail: string
  audienceType: 'all' | 'branch' | 'students'
  branch?: string
  yearOfStudy?: number
  studentIds?: string[]
}

export async function createMeeting(input: CreateMeetingInput): Promise<Meeting> {
  const { data, error } = await supabase.functions.invoke<{ meeting: Meeting }>('create-meeting', {
    body: input,
  })
  if (error) throw error
  if (!data?.meeting) throw new Error('No meeting returned')
  return data.meeting
}

export async function fetchMeetings(): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .order('scheduled_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Meeting[]
}

export async function cancelMeeting(id: string): Promise<void> {
  const { error } = await supabase.from('meetings').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw error
}
