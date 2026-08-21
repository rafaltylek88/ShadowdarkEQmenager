import { supabase } from './supabase'

export type LightStatus = 'off' | 'running' | 'paused'

export type CampaignLight = {
  campaignId: string
  characterId: string | null
  carrierName: string | null
  sourceItemId: string | null
  sourceName: string | null
  durationSeconds: number
  remainingSeconds: number
  status: LightStatus
  startedAt: string | null
  updatedAt?: string
}

function mapLight(row: any): CampaignLight {
  return {
    campaignId: row.campaign_id,
    characterId: row.character_id ?? null,
    carrierName: row.carrier_name ?? null,
    sourceItemId: row.source_item_id ?? null,
    sourceName: row.source_name ?? null,
    durationSeconds: Number(row.duration_seconds ?? 0),
    remainingSeconds: Number(row.remaining_seconds ?? 0),
    status: (row.status ?? 'off') as LightStatus,
    startedAt: row.started_at ?? null,
    updatedAt: row.updated_at,
  }
}

export async function loadCampaignLight(
  campaignId: string
): Promise<CampaignLight | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('campaign_light')
    .select('*')
    .eq('campaign_id', campaignId)
    .maybeSingle()

  if (error) throw error
  return data ? mapLight(data) : null
}

async function callLightRpc(
  fn: string,
  args: Record<string, string>
): Promise<CampaignLight> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw error

  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error('Supabase nie zwrócił stanu światła.')

  return mapLight(row)
}

export function startCampaignLight(
  campaignId: string,
  itemId: string
): Promise<CampaignLight> {
  return callLightRpc('start_campaign_light', {
    p_campaign_id: campaignId,
    p_item_id: itemId,
  })
}

export function pauseCampaignLight(
  campaignId: string
): Promise<CampaignLight> {
  return callLightRpc('pause_campaign_light', {
    p_campaign_id: campaignId,
  })
}

export function resumeCampaignLight(
  campaignId: string
): Promise<CampaignLight> {
  return callLightRpc('resume_campaign_light', {
    p_campaign_id: campaignId,
  })
}

export function extinguishCampaignLight(
  campaignId: string
): Promise<CampaignLight> {
  return callLightRpc('extinguish_campaign_light', {
    p_campaign_id: campaignId,
  })
}
