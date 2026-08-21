import type { Campaign } from '../types'
import { supabase } from './supabase'

function mapCampaign(row: any, role?: string): Campaign {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    createdBy: row.created_by,
    inviteCode: row.invite_code,
    role: role as Campaign['role'],
  }
}

export async function loadRemoteCampaigns(): Promise<Campaign[]> {
  if (!supabase) return []

  const { data: memberships, error: membershipError } = await supabase
    .from('campaign_members')
    .select('campaign_id, role')

  if (membershipError) throw membershipError

  const roles = new Map<string, string>((memberships ?? []).map(m => [String(m.campaign_id), String(m.role)]))
  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, description, created_by, created_at, invite_code')
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(row => mapCampaign(row, roles.get(row.id)))
}

export async function createRemoteCampaign(name: string): Promise<Campaign> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('Brak zalogowanego użytkownika.')

  const { data, error } = await supabase
    .from('campaigns')
    .insert({ name, created_by: userData.user.id })
    .select('id, name, description, created_by, created_at, invite_code')
    .single()

  if (error) throw error

  const { error: memberError } = await supabase.from('campaign_members').insert({
    campaign_id: data.id,
    user_id: userData.user.id,
    role: 'owner',
  })
  if (memberError) throw memberError

  return mapCampaign(data, 'owner')
}

export async function joinCampaign(inviteCode: string): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { data, error } = await supabase.rpc('join_campaign_by_code', {
    p_invite_code: inviteCode.trim().toUpperCase(),
  })
  if (error) throw error
  if (!data) throw new Error('Nie znaleziono kampanii o takim kodzie.')
}
