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

export type HistoryUndoPayload =
  | {
      kind: 'character_patch'
      characterId: string
      before: Record<string, unknown>
      after: Record<string, unknown>
    }
  | {
      kind: 'inventory_quantity'
      ownerType: 'character' | 'npc' | 'animal' | 'bastion'
      itemId: string
      before: number
      after: number
    }
  | {
      kind: 'character_item_flag'
      itemId: string
      flag: 'quickpull' | 'equipped'
      before: boolean
      after: boolean
    }
  | {
      kind: 'catalog_restore'
      catalogItemId: string
      before: Record<string, unknown>
      after: Record<string, unknown>
    }

export type HistoryEntry = {
  id: string
  campaignId: string
  eventType: HistoryEventType
  message: string
  createdBy: string | null
  createdAt: string
  undoPayload: HistoryUndoPayload | null
  undoneAt: string | null
  undoneBy: string | null
}

function mapHistory(row: any): HistoryEntry {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    eventType: row.event_type as HistoryEventType,
    message: row.message,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    undoPayload: row.undo_payload ?? null,
    undoneAt: row.undone_at ?? null,
    undoneBy: row.undone_by ?? null,
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
  message: string,
  undoPayload: HistoryUndoPayload | null = null
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
      undo_payload: undoPayload,
    })

  if (error) throw error
}


export async function markCampaignHistoryUndone(id: string): Promise<void> {
  if (!supabase) return

  const { data: authData } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('campaign_history')
    .update({
      undone_at: new Date().toISOString(),
      undone_by: authData.user?.id ?? null,
    })
    .eq('id', id)
    .is('undone_at', null)

  if (error) throw error
}
