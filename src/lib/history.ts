import { supabase } from './supabase'

export type HistoryEventType =
  | 'inventory'
  | 'trade'
  | 'light'
  | 'food'
  | 'character'
  | 'npc'
  | 'animal'
  | 'bastion'
  | 'library'
  | 'other'

export type HistoryEntry = {
  id: string
  campaignId: string
  eventType: HistoryEventType
  message: string
  createdBy: string | null
  createdAt: string
}

function mapHistory(row: any): HistoryEntry {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    eventType: row.event_type as HistoryEventType,
    message: row.message,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
  }
}

export async function loadCampaignHistory(
  campaignId: string,
  limit = 300
): Promise<HistoryEntry[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('campaign_history')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map(mapHistory)
}

export async function addCampaignHistory(
  campaignId: string,
  eventType: HistoryEventType,
  message: string
): Promise<void> {
  if (!supabase) return

  const { data: authData } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('campaign_history')
    .insert({
      campaign_id: campaignId,
      event_type: eventType,
      message: message.trim(),
      created_by: authData.user?.id ?? null,
    })

  if (error) throw error
}
