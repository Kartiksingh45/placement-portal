import { supabase } from './supabase'
import type { Company } from '../types/database'

function normalizeWebsite(website: string): string {
  const trimmed = website.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export async function fetchCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Company[]
}

export async function createCompany(input: {
  name: string
  description: string
  website: string
  createdBy: string
}): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: input.name,
      description: input.description || null,
      website: normalizeWebsite(input.website) || null,
      created_by: input.createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return data as Company
}

export async function updateCompany(
  id: string,
  input: { name: string; description: string; website: string },
): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .update({
      name: input.name,
      description: input.description || null,
      website: normalizeWebsite(input.website) || null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Company
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) throw error
}
