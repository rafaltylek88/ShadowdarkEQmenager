import { supabase } from './supabase'

export type ItemCategory = 'normal' | 'food' | 'light'

export type CharacterItem = {
  id: string
  campaignId: string
  characterId: string
  name: string
  quantity: number
  slotsPerUnit: number
  category: ItemCategory
  lightMinutes: number | null
  createdAt?: string
  updatedAt?: string
}

function mapItem(row: any): CharacterItem {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    characterId: row.character_id,
    name: row.name,
    quantity: Number(row.quantity),
    slotsPerUnit: Number(row.slots_per_unit),
    category: row.category as ItemCategory,
    lightMinutes: row.light_minutes == null ? null : Number(row.light_minutes),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function loadItems(campaignId: string): Promise<CharacterItem[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('character_items')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapItem)
}

async function syncCharacterUsedSlots(characterId: string): Promise<void> {
  if (!supabase) return

  const { data, error } = await supabase
    .from('character_items')
    .select('quantity, slots_per_unit')
    .eq('character_id', characterId)

  if (error) throw error

  const usedSlots = (data ?? []).reduce(
    (sum, row) => sum + Number(row.quantity) * Number(row.slots_per_unit),
    0
  )

  const { error: updateError } = await supabase
    .from('characters')
    .update({ used_slots: usedSlots })
    .eq('id', characterId)

  if (updateError) throw updateError
}

export async function createItem(input: {
  campaignId: string
  characterId: string
  name: string
  quantity: number
  slotsPerUnit: number
  category: ItemCategory
  lightMinutes?: number | null
}): Promise<CharacterItem> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase
    .from('character_items')
    .insert({
      campaign_id: input.campaignId,
      character_id: input.characterId,
      name: input.name.trim(),
      quantity: input.quantity,
      slots_per_unit: input.slotsPerUnit,
      category: input.category,
      light_minutes: input.category === 'light' ? input.lightMinutes ?? 60 : null,
    })
    .select('*')
    .single()

  if (error) throw error
  await syncCharacterUsedSlots(input.characterId)
  return mapItem(data)
}

export async function updateItem(
  id: string,
  characterId: string,
  changes: {
    name: string
    quantity: number
    slotsPerUnit: number
    category: ItemCategory
    lightMinutes?: number | null
  }
): Promise<CharacterItem> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase
    .from('character_items')
    .update({
      name: changes.name.trim(),
      quantity: changes.quantity,
      slots_per_unit: changes.slotsPerUnit,
      category: changes.category,
      light_minutes: changes.category === 'light' ? changes.lightMinutes ?? 60 : null,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  await syncCharacterUsedSlots(characterId)
  return mapItem(data)
}

export async function deleteItem(id: string, characterId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { error } = await supabase
    .from('character_items')
    .delete()
    .eq('id', id)

  if (error) throw error
  await syncCharacterUsedSlots(characterId)
}
