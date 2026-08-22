import { supabase } from './supabase'

export type Animal = {
  id: string
  campaignId: string
  name: string
  animalType: string
  baseSlots: number
  usedSlots: number
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

function mapAnimal(row: any): Animal {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    animalType: row.animal_type ?? '',
    baseSlots: Number(row.base_slots ?? 10),
    usedSlots: Number(row.used_slots ?? 0),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function loadAnimals(campaignId: string): Promise<Animal[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('animals')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapAnimal)
}

export async function createAnimal(
  campaignId: string,
  name: string,
  animalType: string,
  baseSlots: number
): Promise<Animal> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw userError ?? new Error('Brak aktywnej sesji.')
  }

  const { data, error } = await supabase
    .from('animals')
    .insert({
      campaign_id: campaignId,
      name: name.trim(),
      animal_type: animalType.trim(),
      base_slots: Math.max(0, baseSlots),
      used_slots: 0,
      created_by: userData.user.id,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapAnimal(data)
}

export async function updateAnimal(
  id: string,
  changes: {
    name: string
    animalType: string
    baseSlots: number
  }
): Promise<Animal> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase
    .from('animals')
    .update({
      name: changes.name.trim(),
      animal_type: changes.animalType.trim(),
      base_slots: Math.max(0, changes.baseSlots),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error

  const { error: recalcError } = await supabase.rpc('recalculate_animal_slots', {
    p_animal_id: id,
  })
  if (recalcError) throw recalcError

  return mapAnimal(data)
}

export async function deleteAnimal(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { error } = await supabase.from('animals').delete().eq('id', id)
  if (error) throw error
}
