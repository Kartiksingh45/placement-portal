import { supabase } from './supabase'
import type { StudentSequence } from '../types/database'

export async function fetchSequence(
  companyId: string,
  branch: string,
): Promise<StudentSequence | null> {
  const { data, error } = await supabase
    .from('student_sequences')
    .select('*')
    .eq('company_id', companyId)
    .eq('branch', branch)
    .maybeSingle()
  if (error) throw error
  return data as StudentSequence | null
}

export async function saveSequence(
  companyId: string,
  branch: string,
  studentOrder: string[],
  updatedBy: string,
): Promise<void> {
  const { error } = await supabase.from('student_sequences').upsert(
    {
      company_id: companyId,
      branch,
      student_order: studentOrder,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'company_id,branch' },
  )
  if (error) throw error
}
