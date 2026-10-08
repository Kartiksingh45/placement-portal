import { supabase } from './supabase'
import type { ResumeCheckResult } from '../types/database'

export async function checkResume(resume: unknown): Promise<ResumeCheckResult> {
  const { data, error } = await supabase.functions.invoke<{
    data?: ResumeCheckResult
    error?: string
  }>('check-resume', {
    body: { resume },
  })
  if (error) throw error
  if (data?.error) throw new Error(data.error)
  if (!data?.data) throw new Error('No data returned from check-resume')
  return data.data
}
