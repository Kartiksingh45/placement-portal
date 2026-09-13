import { supabase } from './supabase'
import type { Profile } from '../types/database'

export async function fetchOfficers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'tpo')
    .order('full_name')
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function inviteTpo(email: string, fullName: string): Promise<void> {
  const { error } = await supabase.functions.invoke('invite-tpo', {
    body: {
      email,
      fullName,
      redirectTo: `${window.location.origin}/reset-password`,
    },
  })
  if (error) throw error
}

export async function revokeTpo(userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role: 'student' }).eq('id', userId)
  if (error) throw error
}
