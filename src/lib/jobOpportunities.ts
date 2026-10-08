import { supabase } from './supabase'
import type { JobOpportunity } from '../types/database'

export const JOB_PHOTOS_BUCKET = 'job-photos'

export async function fetchJobOpportunities(): Promise<JobOpportunity[]> {
  const { data, error } = await supabase
    .from('job_opportunities')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as JobOpportunity[]
}

export async function uploadJobPhoto(file: File): Promise<string> {
  const path = `${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage.from(JOB_PHOTOS_BUCKET).upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from(JOB_PHOTOS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function createJobOpportunity(input: {
  companyName: string
  roleTitle: string
  description: string
  photoUrl: string | null
  createdBy: string
}): Promise<JobOpportunity> {
  const { data, error } = await supabase
    .from('job_opportunities')
    .insert({
      company_name: input.companyName,
      role_title: input.roleTitle,
      description: input.description,
      photo_url: input.photoUrl,
      created_by: input.createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return data as JobOpportunity
}

export async function deleteJobOpportunity(id: string): Promise<void> {
  const { error } = await supabase.from('job_opportunities').delete().eq('id', id)
  if (error) throw error
}
