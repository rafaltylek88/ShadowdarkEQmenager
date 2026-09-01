import { supabase } from './supabase'
import type { ItemCategory } from './items'

export type BastionItem = {
  id: string
  campaignId: string
  bastionId: string
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
  maxUses: number
  usesRemaining: number
  createdAt?: string
  updatedAt?: string
}

function mapBastionItem(row: any): BastionItem {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    bastionId: row.bastion_id,
    catalogItemId: row.catalog_item_id ?? null,
    name: row.name,
    quantity: Number(row.quantity ?? 0),
    slotsPerUnit: Number(row.slots_per_unit ?? 1),
    slotGroupSize: Math.max(1, Number(row.slot_group_size ?? 1)),
    freeQuantity: Math.max(0, Number(row.free_quantity ?? 0)),
    category: row.category as ItemCategory,
    lightMinutes: row.light_minutes == null ? null : Number(row.light_minutes),
    weaponDamage: row.weapon_damage ?? null,
    weaponRange: row.weapon_range ?? null,
    weaponProperties: row.weapon_properties ?? null,
    armorClass: row.armor_class ?? null,
    armorProperties: row.armor_properties ?? null,
    maxUses: Math.max(0, Number(row.max_uses ?? 0)),
    usesRemaining: Math.max(0, Number(row.uses_remaining ?? 0)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function loadBastionItems(campaignId: string): Promise<BastionItem[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('bastion_items')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapBastionItem)
}
