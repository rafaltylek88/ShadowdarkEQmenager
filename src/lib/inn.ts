import { supabase } from './supabase'

export type CharacterReserve = {
  characterId: string
  campaignId: string
  sentAt: string
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  return supabase
}

export async function loadCharacterReserves(
  campaignId: string
): Promise<CharacterReserve[]> {
  const sb = requireSupabase()
  const { data, error } = await sb
    .from('character_reserves')
    .select('character_id,campaign_id,sent_at')
    .eq('campaign_id', campaignId)
    .order('sent_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    characterId: row.character_id,
    campaignId: row.campaign_id,
    sentAt: row.sent_at,
  }))
}

export async function sendCharacterToInn(
  campaignId: string,
  characterId: string
) {
  const sb = requireSupabase()
  const { error } = await sb
    .from('character_reserves')
    .insert({
      campaign_id: campaignId,
      character_id: characterId,
    })

  if (error) throw error
}

export async function returnCharacterFromInn(characterId: string) {
  const sb = requireSupabase()
  const { error } = await sb
    .from('character_reserves')
    .delete()
    .eq('character_id', characterId)

  if (error) throw error
}
