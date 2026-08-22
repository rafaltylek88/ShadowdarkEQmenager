import { supabase } from './supabase'
import type { ItemCategory } from './items'

export type NpcItem = {
  id: string
  campaignId: string
  npcId: string
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
  isActiveLight: boolean
  createdAt?: string
  updatedAt?: string
}

function mapNpcItem(row: any): NpcItem {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    npcId: row.npc_id,
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
    isActiveLight: Boolean(row.is_active_light),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function loadNpcItems(campaignId: string): Promise<NpcItem[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('npc_items')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapNpcItem)
}

export async function createNpcItem(input: {
  campaignId: string
  npcId: string
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
}): Promise<NpcItem> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase
    .from('npc_items')
    .insert({
      campaign_id: input.campaignId,
      npc_id: input.npcId,
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

  const { error: recalcError } = await supabase.rpc('recalculate_npc_slots', {
    p_npc_id: input.npcId,
  })
  if (recalcError) throw recalcError

  return mapNpcItem(data)
}

export async function updateNpcItem(
  id: string,
  npcId: string,
  changes: {
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
  }
): Promise<NpcItem> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase
    .from('npc_items')
    .update({
      catalog_item_id: changes.catalogItemId ?? null,
      name: changes.name.trim(),
      quantity: changes.quantity,
      slots_per_unit: changes.slotsPerUnit,
      slot_group_size: Math.max(1, changes.slotGroupSize ?? 1),
      free_quantity: Math.max(0, changes.freeQuantity ?? 0),
      category: changes.category,
      light_minutes: changes.category === 'light' ? changes.lightMinutes ?? 60 : null,
      weapon_damage: changes.category === 'weapon' ? changes.weaponDamage?.trim() || null : null,
      weapon_range: changes.category === 'weapon' ? changes.weaponRange?.trim() || null : null,
      weapon_properties: changes.category === 'weapon' ? changes.weaponProperties?.trim() || null : null,
      armor_class: changes.category === 'armor' ? changes.armorClass?.trim() || null : null,
      armor_properties: changes.category === 'armor' ? changes.armorProperties?.trim() || null : null,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error

  const { error: recalcError } = await supabase.rpc('recalculate_npc_slots', {
    p_npc_id: npcId,
  })
  if (recalcError) throw recalcError

  return mapNpcItem(data)
}

export async function deleteNpcItem(id: string, npcId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { error } = await supabase
    .from('npc_items')
    .delete()
    .eq('id', id)

  if (error) throw error

  const { error: recalcError } = await supabase.rpc('recalculate_npc_slots', {
    p_npc_id: npcId,
  })
  if (recalcError) throw recalcError
}
