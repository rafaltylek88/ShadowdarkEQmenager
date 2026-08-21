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
