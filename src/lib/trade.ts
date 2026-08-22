import { supabase } from './supabase'

export type InventoryOwnerType = 'character' | 'npc' | 'animal' | 'bastion'

export type TradeResult = {
  goldAfter: number
  priceCp: number
}

export async function buyInventoryItem(input: {
  campaignId: string
  ownerType: InventoryOwnerType
  ownerId: string
  buyerCharacterId: string
  catalogItemId: string
  quantity: number
  priceCp: number
}): Promise<TradeResult> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase.rpc('buy_inventory_item', {
    p_campaign_id: input.campaignId,
    p_owner_type: input.ownerType,
    p_owner_id: input.ownerId,
    p_buyer_character_id: input.buyerCharacterId,
    p_catalog_item_id: input.catalogItemId,
    p_quantity: input.quantity,
    p_price_cp: input.priceCp,
  })

  if (error) throw error
  const row = (data ?? {}) as any
  return {
    goldAfter: Number(row.gold_after ?? 0),
    priceCp: Number(row.price_cp ?? input.priceCp),
  }
}

export async function sellInventoryItem(input: {
  campaignId: string
  ownerType: InventoryOwnerType
  itemId: string
  receiverCharacterId: string
  quantity: number
  priceCp: number
}): Promise<TradeResult> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase.rpc('sell_inventory_item', {
    p_campaign_id: input.campaignId,
    p_owner_type: input.ownerType,
    p_item_id: input.itemId,
    p_receiver_character_id: input.receiverCharacterId,
    p_quantity: input.quantity,
    p_price_cp: input.priceCp,
  })

  if (error) throw error
  const row = (data ?? {}) as any
  return {
    goldAfter: Number(row.gold_after ?? 0),
    priceCp: Number(row.price_cp ?? input.priceCp),
  }
}
