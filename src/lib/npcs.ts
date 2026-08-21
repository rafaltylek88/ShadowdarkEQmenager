import { supabase } from './supabase'

export type Npc = {
  id: string
  campaignId: string
  name: string
  role: string
  maxSlots: number
  usedSlots: number
  lastFedAt: string | null
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

function mapNpc(row: any): Npc {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    role: row.role ?? '',
    maxSlots: Number(row.max_slots ?? 10),
    usedSlots: Number(row.used_slots ?? 0),
    lastFedAt: row.last_fed_at ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function loadNpcs(campaignId: string): Promise<Npc[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('npcs')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapNpc)
}

export async function createNpc(
  campaignId: string,
  name: string,
  role: string,
  maxSlots: number
): Promise<Npc> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw userError ?? new Error('Brak aktywnej sesji.')
  }

  const { data, error } = await supabase
    .from('npcs')
    .insert({
      campaign_id: campaignId,
      name: name.trim(),
      role: role.trim(),
      max_slots: Math.max(0, maxSlots),
      used_slots: 0,
      created_by: userData.user.id,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapNpc(data)
}

export async function updateNpc(
  id: string,
  changes: {
    name: string
    role: string
    maxSlots: number
  }
): Promise<Npc> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase
    .from('npcs')
    .update({
      name: changes.name.trim(),
      role: changes.role.trim(),
      max_slots: Math.max(0, changes.maxSlots),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return mapNpc(data)
}

export async function deleteNpc(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { error } = await supabase
    .from('npcs')
    .delete()
    .eq('id', id)

  if (error) throw error
}
