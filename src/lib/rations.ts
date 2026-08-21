import { supabase } from './supabase'

export type FeedExpeditionResult = {
  fedAt: string
  charactersFed: number
}

export async function feedExpedition(
  campaignId: string
): Promise<FeedExpeditionResult> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase.rpc('feed_expedition', {
    p_campaign_id: campaignId,
  })

  if (error) throw error

  const row = (data ?? {}) as any

  return {
    fedAt: row.fed_at ?? new Date().toISOString(),
    charactersFed: Number(row.characters_fed ?? 0),
  }
}

export type TransferRationResult = {
  fromCharacterId: string
  toCharacterId: string
  fromQuantity: number
  toQuantity: number
}

export async function transferRation(
  campaignId: string,
  fromCharacterId: string,
  toCharacterId: string
): Promise<TransferRationResult> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase.rpc('transfer_ration', {
    p_campaign_id: campaignId,
    p_from_character_id: fromCharacterId,
    p_to_character_id: toCharacterId,
  })

  if (error) throw error

  const row = (data ?? {}) as any

  return {
    fromCharacterId: row.from_character_id ?? fromCharacterId,
    toCharacterId: row.to_character_id ?? toCharacterId,
    fromQuantity: Number(row.from_quantity ?? 0),
    toQuantity: Number(row.to_quantity ?? 0),
  }
}
