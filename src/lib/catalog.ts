import { supabase } from './supabase'

export type CatalogItemCategory =
  | 'normal'
  | 'food'
  | 'light'
  | 'weapon'
  | 'armor'

export type CatalogItem = {
  id: string
  campaignId: string
  name: string
  slotsPerUnit: number
  category: CatalogItemCategory
  lightMinutes: number | null
  lightConsumesSource: boolean
  lightFuelItemName: string | null
  lightFuelQuantity: number
  weaponDamage: string | null
  weaponRange: string | null
  weaponProperties: string | null
  armorClass: string | null
  armorProperties: string | null
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

function mapCatalogItem(row: any): CatalogItem {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    slotsPerUnit: Number(row.slots_per_unit),
    category: row.category as CatalogItemCategory,
    lightMinutes: row.light_minutes == null ? null : Number(row.light_minutes),
    lightConsumesSource: row.light_consumes_source !== false,
    lightFuelItemName: row.light_fuel_item_name ?? null,
    lightFuelQuantity: Number(row.light_fuel_quantity ?? 0),
    weaponDamage: row.weapon_damage ?? null,
    weaponRange: row.weapon_range ?? null,
    weaponProperties: row.weapon_properties ?? null,
    armorClass: row.armor_class ?? null,
    armorProperties: row.armor_properties ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function loadCatalog(campaignId: string): Promise<CatalogItem[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('item_catalog')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapCatalogItem)
}

export async function createCatalogItem(input: {
  campaignId: string
  name: string
  slotsPerUnit: number
  category: CatalogItemCategory
  lightMinutes?: number | null
  lightConsumesSource?: boolean
  lightFuelItemName?: string | null
  lightFuelQuantity?: number
  weaponDamage?: string | null
  weaponRange?: string | null
  weaponProperties?: string | null
  armorClass?: string | null
  armorProperties?: string | null
}): Promise<CatalogItem> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw userError ?? new Error('Brak aktywnej sesji.')
  }

  const { data, error } = await supabase
    .from('item_catalog')
    .insert({
      campaign_id: input.campaignId,
      name: input.name.trim(),
      slots_per_unit: input.slotsPerUnit,
      category: input.category,
      light_minutes: input.category === 'light' ? input.lightMinutes ?? 60 : null,
      light_consumes_source:
        input.category === 'light' ? input.lightConsumesSource ?? true : true,
      light_fuel_item_name:
        input.category === 'light' ? input.lightFuelItemName?.trim() || null : null,
      light_fuel_quantity:
        input.category === 'light' ? Math.max(0, input.lightFuelQuantity ?? 0) : 0,
      weapon_damage:
        input.category === 'weapon' ? input.weaponDamage?.trim() || null : null,
      weapon_range:
        input.category === 'weapon' ? input.weaponRange?.trim() || null : null,
      weapon_properties:
        input.category === 'weapon' ? input.weaponProperties?.trim() || null : null,
      armor_class:
        input.category === 'armor' ? input.armorClass?.trim() || null : null,
      armor_properties:
        input.category === 'armor' ? input.armorProperties?.trim() || null : null,
      created_by: userData.user.id,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapCatalogItem(data)
}

export async function deleteCatalogItem(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { error } = await supabase.from('item_catalog').delete().eq('id', id)
  if (error) throw error
}
