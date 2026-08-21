import { supabase } from './supabase'

export type Character = {
  id: string
  campaignId: string
  name: string
  strength: number
  usedSlots: number
  gold: number
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

function mapCharacter(row: any): Character {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    strength: row.strength,
    usedSlots: row.used_slots,
    gold: row.gold,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function loadCharacters(campaignId: string): Promise<Character[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapCharacter)
}

export async function createCharacter(
  campaignId: string,
  name: string,
  strength: number,
  gold: number
): Promise<Character> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw userError ?? new Error('Brak aktywnej sesji.')
  }

  const { data, error } = await supabase
    .from('characters')
    .insert({
      campaign_id: campaignId,
      name: name.trim(),
      strength,
      gold,
      used_slots: 0,
      created_by: userData.user.id,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapCharacter(data)
}

export async function updateCharacter(
  id: string,
  changes: {
    name: string
    strength: number
    gold: number
    usedSlots: number
  }
): Promise<Character> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase
    .from('characters')
    .update({
      name: changes.name.trim(),
      strength: changes.strength,
      gold: changes.gold,
      used_slots: changes.usedSlots,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return mapCharacter(data)
}

export async function deleteCharacter(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id)

  if (error) throw error
}
