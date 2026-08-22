import { supabase } from './supabase'

export type BastionTypeId = 'house' | 'outpost' | 'keep' | 'castle'

export type Bastion = {
  id: string
  campaignId: string
  ownerCharacterId: string
  name: string
  typeId: BastionTypeId
  ac: number
  maxHp: number
  currentHp: number
  maxUpgrades: number
  buildTime: string
  createdAt?: string
  updatedAt?: string
}

export type BastionUpgrade = {
  id: string
  bastionId: string
  upgradeId: string
  createdAt?: string
}

export const BASTION_TYPES = [
  { id: 'house' as const, name: 'House', cost: 200, ac: 12, hp: 40, upgrades: 3, buildTime: '1 tydzień', description: 'Typowy solidny dom, np. chata lub gliniany dom.' },
  { id: 'outpost' as const, name: 'Outpost', cost: 300, ac: 15, hp: 50, upgrades: 5, buildTime: '2 tygodnie', description: 'Ufortyfikowany obóz z drewnianą palisadą o wysokości 15 stóp.' },
  { id: 'keep' as const, name: 'Keep', cost: 1000, ac: 18, hp: 100, upgrades: 10, buildTime: '1 miesiąc', description: 'Wieża o wysokości 60 stóp, trzy kondygnacje; na dachu można ustawić 1 machinę oblężniczą.' },
  { id: 'castle' as const, name: 'Castle', cost: 5000, ac: 18, hp: 300, upgrades: 20, buildTime: '2 miesiące', description: 'Mury o wysokości 30 stóp otaczają keep i dziedziniec; mury mieszczą 8 machin oblężniczych poza trebuszami.' },
]

export const BASTION_UPGRADES = [
  { id: 'aviary', name: 'Aviary', cost: 100, description: 'Wyślij jedną wiadomość dziennie przez gołębia.' },
  { id: 'armorer', name: 'Armorer', cost: 200, description: 'Kupuj zwykłe pancerze za +10% ceny.' },
  { id: 'barracks', name: 'Barracks', cost: 200, description: 'Warbands odzyskują +1d6 HP podczas pobytu tutaj.' },
  { id: 'blacksmith', name: 'Blacksmith', cost: 100, description: 'Kupuj zwykłe bronie za +10% ceny.' },
  { id: 'brewery', name: 'Brewery', cost: 200, description: '+1 do rzutów carousing event w obrębie bastionu.' },
  { id: 'casino', name: 'Casino', cost: 300, description: 'Generuje 2d20 gp miesięcznie.' },
  { id: 'dungeon', name: 'Dungeon', cost: 300, description: 'Podziemne więzienie i tunele.' },
  { id: 'granary', name: 'Granary', cost: 100, description: 'Warbands kosztują w bastionie o 10 gp mniej.' },
  { id: 'idol', name: 'Idol', cost: 400, description: '+1 do CHA spellcasting checks w bastionie.' },
  { id: 'infirmary', name: 'Infirmary', cost: 200, description: 'Pacjenci mają ADV na testach CON.' },
  { id: 'kennels', name: 'Kennels', cost: 300, description: 'DISADV na testach skradania się do bastionu.' },
  { id: 'library', name: 'Library', cost: 400, description: '+1 do downtime learning checks.' },
  { id: 'moat', name: 'Moat', cost: 200, description: 'Fosa szeroka i głęboka na 20 stóp; zawiera most zwodzony.' },
  { id: 'stable', name: 'Stable', cost: 100, description: 'Mounts nie muszą paść się ani zużywać racji.' },
  { id: 'tavern', name: 'Tavern', cost: 400, description: 'PC mogą carouse w bastionie (limit 100 gp).' },
  { id: 'temple', name: 'Temple', cost: 400, description: '+1 do WIS spellcasting checks w bastionie.' },
  { id: 'trading-post', name: 'Trading Post', cost: 100, description: 'Kupuj dowolny basic gear za +10% ceny.' },
  { id: 'trophy-room', name: 'Trophy Room', cost: 100, description: 'Zyskaj 1 XP za każde umieszczone znaczące trofeum.' },
  { id: 'vault', name: 'Vault', cost: 200, description: 'Bezpiecznie przechowuje do 100 slotów ekwipunku.' },
  { id: 'wizard-tower', name: 'Wizard Tower', cost: 400, description: '+1 do INT spellcasting checks w bastionie.' },
]

function mapBastion(row: any): Bastion {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    ownerCharacterId: row.owner_character_id,
    name: row.name,
    typeId: row.type_id as BastionTypeId,
    ac: Number(row.ac),
    maxHp: Number(row.max_hp),
    currentHp: Number(row.current_hp),
    maxUpgrades: Number(row.max_upgrades),
    buildTime: row.build_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapUpgrade(row: any): BastionUpgrade {
  return {
    id: row.id,
    bastionId: row.bastion_id,
    upgradeId: row.upgrade_id,
    createdAt: row.created_at,
  }
}

export async function loadBastions(campaignId: string): Promise<Bastion[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('bastions')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapBastion)
}

export async function loadBastionUpgrades(campaignId: string): Promise<BastionUpgrade[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('bastion_upgrades')
    .select('id,bastion_id,upgrade_id,created_at,bastions!inner(campaign_id)')
    .eq('bastions.campaign_id', campaignId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(mapUpgrade)
}

export async function createBastion(
  campaignId: string,
  ownerCharacterId: string,
  name: string,
  typeId: BastionTypeId
): Promise<Bastion> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')

  const { data, error } = await supabase.rpc('create_bastion', {
    p_campaign_id: campaignId,
    p_owner_character_id: ownerCharacterId,
    p_name: name.trim(),
    p_type_id: typeId,
  })

  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error('Supabase nie zwrócił bastionu.')
  return mapBastion(row)
}

export async function deleteBastion(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { error } = await supabase.from('bastions').delete().eq('id', id)
  if (error) throw error
}

export async function setBastionHp(id: string, hp: number): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { error } = await supabase.rpc('set_bastion_hp', {
    p_bastion_id: id,
    p_hp: hp,
  })
  if (error) throw error
}

export async function repairBastion(id: string, hp: number): Promise<{ repaired: number; costGp: number }> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { data, error } = await supabase.rpc('repair_bastion', {
    p_bastion_id: id,
    p_hp: hp,
  })
  if (error) throw error
  const row = (data ?? {}) as any
  return { repaired: Number(row.repaired ?? 0), costGp: Number(row.cost_gp ?? 0) }
}

export async function addBastionUpgrade(bastionId: string, upgradeId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { error } = await supabase.rpc('add_bastion_upgrade', {
    p_bastion_id: bastionId,
    p_upgrade_id: upgradeId,
  })
  if (error) throw error
}

export async function removeBastionUpgrade(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase nie jest skonfigurowany.')
  const { error } = await supabase.from('bastion_upgrades').delete().eq('id', id)
  if (error) throw error
}
