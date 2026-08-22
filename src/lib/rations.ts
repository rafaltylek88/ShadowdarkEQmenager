import { supabase } from './supabase'

export type MemberType = 'character' | 'npc'

export type FeedExpeditionResult = {
  fedAt: string
  membersFed: number
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
    membersFed: Number(row.members_fed ?? row.characters_fed ?? 0),
  }
}

export async function transferMemberRation(
  campaignId: string,
  fromType: MemberType,
  fromId: string,
  toType: MemberType,
  toId: string
): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { error } = await supabase.rpc('transfer_member_ration', {
    p_campaign_id: campaignId,
    p_from_type: fromType,
    p_from_id: fromId,
    p_to_type: toType,
    p_to_id: toId,
  })

  if (error) throw error
}


export type AnimalFeedMethod = 'ration' | 'pasture'

export type FeedAnimalsResult = {
  fedAt: string
  animalsFed: number
  method: AnimalFeedMethod
}

export async function feedAnimals(
  campaignId: string,
  method: AnimalFeedMethod
): Promise<FeedAnimalsResult> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase.rpc('feed_animals', {
    p_campaign_id: campaignId,
    p_method: method,
  })

  if (error) throw error

  const row = (data ?? {}) as any

  return {
    fedAt: row.fed_at ?? new Date().toISOString(),
    animalsFed: Number(row.animals_fed ?? 0),
    method: (row.method ?? method) as AnimalFeedMethod,
  }
}
