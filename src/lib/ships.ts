import { supabase } from './supabase'
import type { ItemCategory } from './items'

export const SHIP_TYPES = [
  { id: 'canoe', name: 'Canoe', cost: 200, speed: 4, ac: 9, hp: 10, slots: 20, properties: '—' },
  { id: 'galleon', name: 'Galleon', cost: 1500, speed: 8, ac: 18, hp: 80, slots: 500, properties: 'C, R, W' },
  { id: 'junk', name: 'Junk', cost: 400, speed: 8, ac: 12, hp: 50, slots: 300, properties: 'C, R, W' },
  { id: 'longboat', name: 'Longboat', cost: 500, speed: 10, ac: 15, hp: 40, slots: 200, properties: 'C, F, R' },
  { id: 'raft', name: 'Raft', cost: 40, speed: 2, ac: 9, hp: 10, slots: 20, properties: 'U' },
  { id: 'rowboat', name: 'Rowboat', cost: 200, speed: 4, ac: 12, hp: 10, slots: 30, properties: 'U' },
  { id: 'sailboat', name: 'Sailboat', cost: 700, speed: 8, ac: 15, hp: 60, slots: 200, properties: 'C, F, W' },
  { id: 'sloop', name: 'Sloop', cost: 400, speed: 8, ac: 15, hp: 30, slots: 200, properties: 'C' },
] as const
export type ShipTypeId = typeof SHIP_TYPES[number]['id']
export type Ship = { id: string; campaignId: string; name: string; typeId: ShipTypeId; currentHp: number; imageUrl: string; description: string }
export type ShipCabin = { id: string; shipId: string; number: number; characterId: string | null }
export type ShipItem = { id: string; campaignId: string; shipId: string; location: number; catalogItemId: string | null; name: string; quantity: number; slotsPerUnit: number; slotGroupSize: number; freeQuantity: number; category: ItemCategory }
const check = (error: any) => { if (error) throw error }
export async function loadShips(campaignId: string): Promise<Ship[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('ships').select('*').eq('campaign_id', campaignId).order('created_at')
  check(error)
  return (data ?? []).map((r: any) => ({ id: r.id, campaignId: r.campaign_id, name: r.name, typeId: r.type_id, currentHp: r.current_hp, imageUrl: r.image_url ?? '', description: r.description ?? '' }))
}
export async function createShip(campaignId: string, name: string, typeId: ShipTypeId) {
  if (!supabase) return
  const type = SHIP_TYPES.find(t => t.id === typeId)!
  const { error } = await supabase.from('ships').insert({ campaign_id: campaignId, name, type_id: typeId, current_hp: type.hp })
  check(error)
}
export async function updateShip(id: string, patch: Partial<Pick<Ship, 'name' | 'currentHp' | 'imageUrl' | 'description'>>) {
  if (!supabase) return
  const payload: Record<string, unknown> = {}
  if (patch.name !== undefined) payload.name = patch.name
  if (patch.currentHp !== undefined) payload.current_hp = patch.currentHp
  if (patch.imageUrl !== undefined) payload.image_url = patch.imageUrl
  if (patch.description !== undefined) payload.description = patch.description
  const { error } = await supabase.from('ships').update(payload).eq('id', id)
  check(error)
}
export async function deleteShip(id: string) {
  if (!supabase) return
  const { error } = await supabase.from('ships').delete().eq('id', id)
  check(error)
}
export async function loadShipCabins(campaignId: string): Promise<ShipCabin[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('ship_cabins').select('id,ship_id,cabin_number,character_id,ships!inner(campaign_id)').eq('ships.campaign_id', campaignId)
  check(error)
  return (data ?? []).map((r: any) => ({ id: r.id, shipId: r.ship_id, number: r.cabin_number, characterId: r.character_id }))
}
export async function assignShipCabin(id: string, characterId: string | null) {
  if (!supabase) return
  const { error } = await supabase.from('ship_cabins').update({ character_id: characterId }).eq('id', id)
  check(error)
}
export async function loadShipItems(campaignId: string): Promise<ShipItem[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('ship_items').select('*').eq('campaign_id', campaignId).order('created_at')
  check(error)
  return (data ?? []).map((r: any) => ({ id: r.id, campaignId: r.campaign_id, shipId: r.ship_id, location: r.location, catalogItemId: r.catalog_item_id, name: r.name, quantity: Number(r.quantity), slotsPerUnit: Number(r.slots_per_unit), slotGroupSize: Number(r.slot_group_size), freeQuantity: Number(r.free_quantity), category: r.category }))
}
export async function createShipItem(item: Omit<ShipItem, 'id'>) {
  if (!supabase) return
  const { error } = await supabase.from('ship_items').insert({ campaign_id: item.campaignId, ship_id: item.shipId, location: item.location, catalog_item_id: item.catalogItemId, name: item.name, quantity: item.quantity, slots_per_unit: item.slotsPerUnit, slot_group_size: item.slotGroupSize, free_quantity: item.freeQuantity, category: item.category })
  check(error)
}
export async function updateShipItem(id: string, quantity: number) {
  if (!supabase) return
  const { error } = await supabase.from('ship_items').update({ quantity }).eq('id', id)
  check(error)
}
export async function deleteShipItem(id: string) {
  if (!supabase) return
  const { error } = await supabase.from('ship_items').delete().eq('id', id)
  check(error)
}
export function shipItemSlots(item: ShipItem) {
  return Math.ceil(Math.max(0, item.quantity - item.freeQuantity) / Math.max(1, item.slotGroupSize)) * item.slotsPerUnit
}
export function shipLocationName(location: number) { return location === 0 ? 'Ładownia' : `Kajuta ${location}` }
