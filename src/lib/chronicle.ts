import { supabase } from './supabase'

export type ChronicleSeason = 'Wiosna' | 'Lato' | 'Jesień' | 'Zima'

export type ChronicleEntry = {
  id: string
  campaignId: string
  title: string
  sessionNumber: number
  worldDay: number
  season: ChronicleSeason
  content: string
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

function fromRow(row: any): ChronicleEntry {
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    title: String(row.title),
    sessionNumber: Number(row.session_number),
    worldDay: Number(row.world_day),
    season: row.season as ChronicleSeason,
    content: String(row.content ?? ''),
    createdBy: row.created_by ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

export async function loadChronicleEntries(campaignId: string): Promise<ChronicleEntry[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('campaign_chronicle')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('world_day', { ascending: false })
    .order('session_number', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(fromRow)
}

export async function createChronicleEntry(
  campaignId: string,
  input: Omit<ChronicleEntry, 'id' | 'campaignId' | 'createdBy' | 'createdAt' | 'updatedAt'>
): Promise<ChronicleEntry | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('campaign_chronicle')
    .insert({
      campaign_id: campaignId,
      title: input.title,
      session_number: input.sessionNumber,
      world_day: input.worldDay,
      season: input.season,
      content: input.content,
    })
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function updateChronicleEntry(
  id: string,
  input: Pick<ChronicleEntry, 'title' | 'sessionNumber' | 'worldDay' | 'season' | 'content'>
): Promise<ChronicleEntry | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('campaign_chronicle')
    .update({
      title: input.title,
      session_number: input.sessionNumber,
      world_day: input.worldDay,
      season: input.season,
      content: input.content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data ? fromRow(data) : null
}

export async function deleteChronicleEntry(id: string) {
  if (!supabase) return
  const { error } = await supabase.from('campaign_chronicle').delete().eq('id', id)
  if (error) throw error
}
