import { supabase } from './supabase'

export type Character = {
  id: string
  campaignId: string
  name: string
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  usedSlots: number
  gold: number
  currentHp: number
  maxHp: number
  ancestry: string
  className: string
  level: number
  xp: number
  xpNext: number
  title: string
  alignment: string
  background: string
  deity: string
  talentsSpells: string
  backstory: string
  portraitUrl: string
  lastFedAt: string | null
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

function mapCharacter(row: any): Character {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    name: row.name,
    strength: Number(row.strength ?? 10),
    dexterity: Number(row.dexterity ?? 10),
    constitution: Number(row.constitution ?? 10),
    intelligence: Number(row.intelligence ?? 10),
    wisdom: Number(row.wisdom ?? 10),
    charisma: Number(row.charisma ?? 10),
    usedSlots: Number(row.used_slots ?? 0),
    gold: Number(row.gold ?? 0),
    currentHp: Math.max(0, Number(row.current_hp ?? 1)),
    maxHp: Math.max(1, Number(row.max_hp ?? 1)),
    ancestry: row.ancestry ?? '',
    className: row.class_name ?? '',
    level: Math.max(1, Number(row.level ?? 1)),
    xp: Math.max(0, Number(row.xp ?? 0)),
    xpNext: Math.max(1, Number(row.xp_next ?? 10)),
    title: row.title ?? '',
    alignment: row.alignment ?? '',
    background: row.background ?? '',
    deity: row.deity ?? '',
    talentsSpells: row.talents_spells ?? '',
    backstory: row.backstory ?? '',
    portraitUrl: row.portrait_url ?? '',
    lastFedAt: row.last_fed_at ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function loadCharacters(campaignId: string): Promise<Character[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('characters').select('*').eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapCharacter)
}

export async function createCharacter(
  campaignId: string,
  name: string,
  strength: number,
  gold: number,
  stats?: {
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
    currentHp?: number
    maxHp?: number
    ancestry?: string
    className?: string
    level?: number
    xp?: number
    xpNext?: number
    title?: string
    alignment?: string
    background?: string
    deity?: string
    talentsSpells?: string
    backstory?: string
    portraitUrl?: string
  }
): Promise<Character> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw userError ?? new Error('Brak aktywnej sesji.')

  const { data, error } = await supabase.from('characters').insert({
    campaign_id: campaignId,
    name: name.trim(),
    strength,
    dexterity: stats?.dexterity ?? 10,
    constitution: stats?.constitution ?? 10,
    intelligence: stats?.intelligence ?? 10,
    wisdom: stats?.wisdom ?? 10,
    charisma: stats?.charisma ?? 10,
    gold,
    max_hp: Math.max(1, Math.floor(stats?.maxHp ?? 1)),
    current_hp: Math.min(
      Math.max(0, Math.floor(stats?.currentHp ?? stats?.maxHp ?? 1)),
      Math.max(1, Math.floor(stats?.maxHp ?? 1))
    ),
    ancestry: stats?.ancestry?.trim() ?? '',
    class_name: stats?.className?.trim() ?? '',
    level: Math.max(1, Math.floor(stats?.level ?? 1)),
    xp: Math.max(0, Math.floor(stats?.xp ?? 0)),
    xp_next: Math.max(1, Math.floor(stats?.xpNext ?? 10)),
    title: stats?.title?.trim() ?? '',
    alignment: stats?.alignment?.trim() ?? '',
    background: stats?.background?.trim() ?? '',
    deity: stats?.deity?.trim() ?? '',
    talents_spells: stats?.talentsSpells?.trim() ?? '',
    backstory: stats?.backstory?.trim() ?? '',
    portrait_url: stats?.portraitUrl?.trim() ?? '',
    used_slots: 0,
    created_by: userData.user.id,
  }).select('*').single()

  if (error) throw error
  return mapCharacter(data)
}

export async function updateCharacter(
  id: string,
  changes: {
    name: string
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
    gold: number
    currentHp: number
    maxHp: number
    ancestry: string
    className: string
    level: number
    xp: number
    xpNext: number
    title: string
    alignment: string
    background: string
    deity: string
    talentsSpells: string
    backstory: string
    portraitUrl: string
    usedSlots: number
  }
): Promise<Character> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { data, error } = await supabase.from('characters').update({
    name: changes.name.trim(),
    strength: changes.strength,
    dexterity: changes.dexterity,
    constitution: changes.constitution,
    intelligence: changes.intelligence,
    wisdom: changes.wisdom,
    charisma: changes.charisma,
    gold: changes.gold,
    max_hp: Math.max(1, Math.floor(changes.maxHp)),
    current_hp: Math.min(
      Math.max(0, Math.floor(changes.currentHp)),
      Math.max(1, Math.floor(changes.maxHp))
    ),
    ancestry: changes.ancestry.trim(),
    class_name: changes.className.trim(),
    level: Math.max(1, Math.floor(changes.level)),
    xp: Math.max(0, Math.floor(changes.xp)),
    xp_next: Math.max(1, Math.floor(changes.xpNext)),
    title: changes.title.trim(),
    alignment: changes.alignment.trim(),
    background: changes.background.trim(),
    deity: changes.deity.trim(),
    talents_spells: changes.talentsSpells.trim(),
    backstory: changes.backstory.trim(),
    portrait_url: changes.portraitUrl.trim(),
    used_slots: changes.usedSlots,
  }).eq('id', id).select('*').single()
  if (error) throw error
  return mapCharacter(data)
}

export async function deleteCharacter(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { error } = await supabase.from('characters').delete().eq('id', id)
  if (error) throw error
}
