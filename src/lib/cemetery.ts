import { supabase } from './supabase'

export type CharacterMemorial = {
  characterId: string
  campaignId: string
  deathDay: number | null
  deathSession: number | null
  deathCause: string | null
  diedAt: string
}

function fromRow(row: any): CharacterMemorial {
  return {
    characterId: String(row.character_id),
    campaignId: String(row.campaign_id),
    deathDay: row.death_day == null ? null : Number(row.death_day),
    deathSession: row.death_session == null ? null : Number(row.death_session),
    deathCause: row.death_cause ?? null,
    diedAt: String(row.died_at),
  }
}

export async function loadCharacterMemorials(campaignId: string): Promise<CharacterMemorial[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('character_memorials')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('died_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function markCharacterDead(
  campaignId: string,
  characterId: string,
  input: { deathDay: number | null; deathSession: number | null; deathCause: string | null }
) {
  if (!supabase) return
  const { error } = await supabase.from('character_memorials').upsert(
    {
      campaign_id: campaignId,
      character_id: characterId,
      death_day: input.deathDay,
      death_session: input.deathSession,
      death_cause: input.deathCause,
      died_at: new Date().toISOString(),
    },
    { onConflict: 'character_id' }
  )
  if (error) throw error
}

export async function restoreCharacterFromCemetery(characterId: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('character_memorials')
    .delete()
    .eq('character_id', characterId)
  if (error) throw error
}
