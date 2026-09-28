import { supabase } from './supabase'

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

export async function revealCampaignHex(
  campaignId: string,
  hexId: string
) {
  if (!supabase) return

  const { error } = await supabase
    .from('campaign_map_hexes')
    .upsert(
      {
        campaign_id: campaignId,
        hex_id: hexId,
      },
      {
        onConflict: 'campaign_id,hex_id',
      }
    )

  if (error) throw error
}

export async function hideCampaignHex(
  campaignId: string,
  hexId: string
) {
  if (!supabase) return

  const { error } = await supabase
    .from('campaign_map_hexes')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('hex_id', hexId)

  if (error) throw error
}
