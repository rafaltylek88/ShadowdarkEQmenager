import { supabase } from './supabase'
import type { ItemCategory } from './items'

export type AnimalItem = {
  id: string
  campaignId: string
  animalId: string
  catalogItemId: string | null
  name: string
  quantity: number
  slotsPerUnit: number
  slotGroupSize: number
  freeQuantity: number
  category: ItemCategory
  lightMinutes: number | null
  weaponDamage: string | null
  weaponRange: string | null
  weaponProperties: string | null
  armorClass: string | null
  armorProperties: string | null
  createdAt?: string
  updatedAt?: string
}

function mapAnimalItem(row: any): AnimalItem {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    animalId: row.animal_id,
    catalogItemId: row.catalog_item_id ?? null,
    name: row.name,
    quantity: Number(row.quantity),
    slotsPerUnit: Number(row.slots_per_unit),
    slotGroupSize: Math.max(1, Number(row.slot_group_size ?? 1)),
    freeQuantity: Math.max(0, Number(row.free_quantity ?? 0)),
    category: row.category as ItemCategory,
    lightMinutes: row.light_minutes == null ? null : Number(row.light_minutes),
    weaponDamage: row.weapon_damage ?? null,
    weaponRange: row.weapon_range ?? null,
    weaponProperties: row.weapon_properties ?? null,
    armorClass: row.armor_class ?? null,
    armorProperties: row.armor_properties ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function loadAnimalItems(campaignId: string): Promise<AnimalItem[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('animal_items')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapAnimalItem)
}

export async function createAnimalItem(input: {
  campaignId: string
  animalId: string
  catalogItemId?: string | null
  name: string
  quantity: number
  slotsPerUnit: number
  slotGroupSize?: number
  freeQuantity?: number
  category: ItemCategory
  lightMinutes?: number | null
  weaponDamage?: string | null
  weaponRange?: string | null
  weaponProperties?: string | null
  armorClass?: string | null
  armorProperties?: string | null
}): Promise<AnimalItem> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase
    .from('animal_items')
    .insert({
      campaign_id: input.campaignId,
      animal_id: input.animalId,
      catalog_item_id: input.catalogItemId ?? null,
      name: input.name.trim(),
      quantity: input.quantity,
      slots_per_unit: input.slotsPerUnit,
      slot_group_size: Math.max(1, input.slotGroupSize ?? 1),
      free_quantity: Math.max(0, input.freeQuantity ?? 0),
      category: input.category,
      light_minutes: input.category === 'light' ? input.lightMinutes ?? 60 : null,
      weapon_damage: input.category === 'weapon' ? input.weaponDamage?.trim() || null : null,
      weapon_range: input.category === 'weapon' ? input.weaponRange?.trim() || null : null,
      weapon_properties: input.category === 'weapon' ? input.weaponProperties?.trim() || null : null,
      armor_class: input.category === 'armor' ? input.armorClass?.trim() || null : null,
      armor_properties: input.category === 'armor' ? input.armorProperties?.trim() || null : null,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapAnimalItem(data)
}

export async function updateAnimalItem(
  id: string,
  changes: {
    name: string
    quantity: number
  }
): Promise<AnimalItem> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase
    .from('animal_items')
    .update({
      name: changes.name.trim(),
      quantity: Math.max(1, changes.quantity),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return mapAnimalItem(data)
}

export async function deleteAnimalItem(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { error } = await supabase.from('animal_items').delete().eq('id', id)
  if (error) throw error
}
