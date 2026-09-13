import { supabase } from './supabase'
import type { Drive } from '../types/database'

export interface DriveWithCompany extends Drive {
  companies: { name: string; website: string | null } | null
}

export async function fetchDrives(): Promise<DriveWithCompany[]> {
  const { data, error } = await supabase
    .from('drives')
    .select('*, companies(name, website)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as DriveWithCompany[]
}

export async function fetchOpenDrives(): Promise<DriveWithCompany[]> {
  const { data, error } = await supabase
    .from('drives')
    .select('*, companies(name, website)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as DriveWithCompany[]
}

export interface DriveInput {
  companyId: string
  roleTitle: string
  description: string
  minCgpa: number
  eligibleBranches: string[]
  requiredSkills: string[]
  requiredCertifications: string[]
  deadline: string
  status: 'open' | 'closed'
}

export async function createDrive(input: DriveInput, createdBy: string): Promise<Drive> {
  const { data, error } = await supabase
    .from('drives')
    .insert({
      company_id: input.companyId,
      role_title: input.roleTitle,
      description: input.description || null,
      min_cgpa: input.minCgpa,
      eligible_branches: input.eligibleBranches,
      required_skills: input.requiredSkills,
      required_certifications: input.requiredCertifications,
      deadline: input.deadline || null,
      status: input.status,
      created_by: createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return data as Drive
}

export async function updateDrive(id: string, input: DriveInput): Promise<Drive> {
  const { data, error } = await supabase
    .from('drives')
    .update({
      company_id: input.companyId,
      role_title: input.roleTitle,
      description: input.description || null,
      min_cgpa: input.minCgpa,
      eligible_branches: input.eligibleBranches,
      required_skills: input.requiredSkills,
      required_certifications: input.requiredCertifications,
      deadline: input.deadline || null,
      status: input.status,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Drive
}

export async function deleteDrive(id: string): Promise<void> {
  const { error } = await supabase.from('drives').delete().eq('id', id)
  if (error) throw error
}
