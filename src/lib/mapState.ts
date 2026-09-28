import { supabase } from './supabase'

export type MapMarkerType =
  | 'location'
  | 'settlement'
  | 'danger'
  | 'treasure'
  | 'quest'

export type CampaignMapMarker = {
  id: string
  campaignId: string
  hexId: string
  markerType: MapMarkerType
  name: string
  note: string | null
  isGm: boolean
  createdBy: string | null
  createdAt: string
}

function mapMarkerRow(row: any): CampaignMapMarker {
  return {
    id: String(row.id),
    campaignId: String(row.campaign_id),
    hexId: String(row.hex_id),
    markerType: row.marker_type as MapMarkerType,
    name: String(row.name),
    note: row.note ?? null,
    isGm: Boolean(row.is_gm),
    createdBy: row.created_by ?? null,
    createdAt: String(row.created_at),
  }
}

export async function loadRevealedCampaignHexes(
  campaignId: string
): Promise<string[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('campaign_map_hexes')
    .select('hex_id')
    .eq('campaign_id', campaignId)
    .order('hex_id')

  if (error) throw error
  return (data ?? []).map(row => String(row.hex_id))
}

export async function revealCampaignHex(campaignId: string, hexId: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('campaign_map_hexes')
    .upsert(
      { campaign_id: campaignId, hex_id: hexId },
      { onConflict: 'campaign_id,hex_id' }
    )
  if (error) throw error
}

export async function hideCampaignHex(campaignId: string, hexId: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('campaign_map_hexes')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('hex_id', hexId)
  if (error) throw error
}

export async function loadMapMarkers(
  campaignId: string
): Promise<CampaignMapMarker[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('campaign_map_markers')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(mapMarkerRow)
}

export async function createMapMarker(
  campaignId: string,
  input: {
    hexId: string
    markerType: MapMarkerType
    name: string
    note?: string
    isGm: boolean
  }
) {
  if (!supabase) return
  const { error } = await supabase.from('campaign_map_markers').insert({
    campaign_id: campaignId,
    hex_id: input.hexId,
    marker_type: input.markerType,
    name: input.name,
    note: input.note || null,
    is_gm: input.isGm,
  })
  if (error) throw error
}

export async function updateMapMarker(
  id: string,
  input: { markerType: MapMarkerType; name: string; note?: string }
) {
  if (!supabase) return
  const { error } = await supabase
    .from('campaign_map_markers')
    .update({
      marker_type: input.markerType,
      name: input.name,
      note: input.note || null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteMapMarker(id: string) {
  if (!supabase) return
  const { error } = await supabase
    .from('campaign_map_markers')
    .delete()
    .eq('id', id)
  if (error) throw error
}
