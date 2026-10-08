import { supabase } from './supabase'
import type { BuilderResume } from '../types/database'

export async function saveBuilderResume(userId: string, resume: BuilderResume): Promise<void> {
  const { error } = await supabase
    .from('student_profiles')
    .update({ builder_resume: resume, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  if (error) throw error
}
