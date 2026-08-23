import { supabase } from './supabase'

export async function setCharacterItemEquipped(
  itemId: string,
  equipped: boolean
): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { error } = await supabase.rpc('set_character_item_equipped', {
    p_item_id: itemId,
    p_equipped: equipped,
  })

  if (error) throw error
}
