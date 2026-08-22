import { supabase } from './supabase'

export async function setCharacterItemQuickpull(itemId: string, enabled: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { error } = await supabase.rpc('set_character_item_quickpull', {
    p_item_id: itemId,
    p_enabled: enabled,
  })
  if (error) throw error
}
