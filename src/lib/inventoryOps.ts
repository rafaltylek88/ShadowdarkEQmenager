import { supabase } from './supabase'
import type { InventoryOwnerType } from './trade'

export async function setInventoryItemQuantity(input: {
  campaignId: string
  ownerType: InventoryOwnerType
  itemId: string
  quantity: number
}): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { error } = await supabase.rpc('set_inventory_item_quantity', {
    p_campaign_id: input.campaignId,
    p_owner_type: input.ownerType,
    p_item_id: input.itemId,
    p_quantity: Math.max(0, Math.floor(input.quantity)),
  })

  if (error) throw error
}

export async function transferInventoryItem(input: {
  campaignId: string
  fromType: InventoryOwnerType
  itemId: string
  toType: InventoryOwnerType
  toId: string
  quantity: number
}): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { error } = await supabase.rpc('transfer_inventory_item', {
    p_campaign_id: input.campaignId,
    p_from_type: input.fromType,
    p_item_id: input.itemId,
    p_to_type: input.toType,
    p_to_id: input.toId,
    p_quantity: Math.max(1, Math.floor(input.quantity)),
  })

  if (error) throw error
}
