import { supabase } from './supabase'

export type StoryCharacter = {
  id: string
  campaignId: string
  name: string
  location: string
  meetingTime: string
  meetingCircumstances: string
  quest: string
  faction: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

function mapStoryCharacter(row: any): StoryCharacter {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name ?? '',
    location: row.location ?? '',
    meetingTime: row.meeting_time ?? '',
    meetingCircumstances: row.meeting_circumstances ?? '',
    quest: row.quest ?? '',
    faction: row.faction ?? '',
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  }
}

export async function loadStoryCharacters(
  campaignId: string
): Promise<StoryCharacter[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('story_characters')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapStoryCharacter)
}

export async function createStoryCharacter(
  campaignId: string,
  input: {
    name: string
    location: string
    meetingTime: string
    meetingCircumstances: string
    quest: string
    faction: string
  }
): Promise<StoryCharacter> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw userError ?? new Error('Brak aktywnej sesji.')
  }

  const { data, error } = await supabase
    .from('story_characters')
    .insert({
      campaign_id: campaignId,
      name: input.name.trim(),
      location: input.location.trim(),
      meeting_time: input.meetingTime.trim(),
      meeting_circumstances: input.meetingCircumstances.trim(),
      quest: input.quest.trim(),
      faction: input.faction.trim(),
      created_by: userData.user.id,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapStoryCharacter(data)
}

export async function updateStoryCharacter(
  id: string,
  input: {
    name: string
    location: string
    meetingTime: string
    meetingCircumstances: string
    quest: string
    faction: string
  }
): Promise<StoryCharacter> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase
    .from('story_characters')
    .update({
      name: input.name.trim(),
      location: input.location.trim(),
      meeting_time: input.meetingTime.trim(),
      meeting_circumstances: input.meetingCircumstances.trim(),
      quest: input.quest.trim(),
      faction: input.faction.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return mapStoryCharacter(data)
}

export async function deleteStoryCharacter(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { error } = await supabase
    .from('story_characters')
    .delete()
    .eq('id', id)

  if (error) throw error
}
