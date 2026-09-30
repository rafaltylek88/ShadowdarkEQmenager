import { supabase } from './supabase'
import type { ItemCategory } from './items'

export type TreasureItem = {
  id: string
  campaignId: string
  name: string
  quantity: number
  category: ItemCategory
  createdAt: string
}

function fromRow(row: any): TreasureItem {
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    name: String(row.name),
    quantity: Number(row.quantity),
    category: row.category as ItemCategory,
    createdAt: String(row.created_at),
  }
}

export async function loadTreasureItems(campaignId: string): Promise<TreasureItem[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('campaign_treasure_items')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function createTreasureItem(input: {
  campaignId: string
  name: string
  quantity: number
  category: ItemCategory
}) {
  if (!supabase) return
  const { error } = await supabase.from('campaign_treasure_items').insert({
    campaign_id: input.campaignId,
    name: input.name,
    quantity: input.quantity,
    category: input.category,
  })
  if (error) throw error
}

export async function deleteTreasureItem(id: string) {
  if (!supabase) return
  const { error } = await supabase.from('campaign_treasure_items').delete().eq('id', id)
  if (error) throw error
}
