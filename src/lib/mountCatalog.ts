import type { Animal } from './animals'

export type MountRarity = 'C' | 'U' | 'R' | 'L'
export type MountProperty = 'A' | 'F' | 'G' | 'S'

export type MountCatalogEntry = {
  name: string
  cost: string
  rarity: MountRarity
  gearSlots: number
  properties: MountProperty[]
}

export type MountPersonality = Exclude<Animal['personality'], ''>

export const MOUNT_CATALOG: MountCatalogEntry[] = [
  { name: 'Camel', cost: '50 gp', rarity: 'C', gearSlots: 15, properties: [] },
  { name: 'Camel, silver', cost: '200 gp', rarity: 'R', gearSlots: 15, properties: ['G'] },
  { name: 'Donkey', cost: '40 gp', rarity: 'C', gearSlots: 20, properties: ['S'] },
  { name: 'Elephant', cost: '400 gp', rarity: 'R', gearSlots: 30, properties: ['S'] },
  { name: 'Griffon', cost: '—', rarity: 'L', gearSlots: 20, properties: ['A', 'F'] },
  { name: 'Hippogriff', cost: '—', rarity: 'L', gearSlots: 15, properties: ['A', 'F'] },
  { name: 'Horse', cost: '50 gp', rarity: 'C', gearSlots: 15, properties: [] },
  { name: 'Horse, prized', cost: '90 gp', rarity: 'C', gearSlots: 15, properties: ['G'] },
  { name: 'Horse, war', cost: '100 gp', rarity: 'U', gearSlots: 20, properties: ['A', 'S'] },
  { name: 'Moose', cost: '200 gp', rarity: 'R', gearSlots: 15, properties: [] },
  { name: 'Pegasus', cost: '—', rarity: 'L', gearSlots: 15, properties: ['A', 'F', 'G'] },
  { name: 'Pony', cost: '60 gp', rarity: 'C', gearSlots: 20, properties: ['G', 'S'] },
  { name: 'Scrag', cost: '150 gp', rarity: 'U', gearSlots: 10, properties: [] },
  { name: 'Scrag, war', cost: '250 gp', rarity: 'R', gearSlots: 15, properties: ['A'] },
  { name: 'Worg', cost: '200 gp', rarity: 'U', gearSlots: 10, properties: ['A'] },
]

export const MOUNT_PROPERTY_INFO: Record<MountProperty, { name: string; description: string }> = {
  A: { name: 'Armor', description: 'Może nosić pancerz.' },
  F: { name: 'Flying', description: 'Może latać, niosąc jednego jeźdźca.' },
  G: { name: 'Good-Tempered', description: '+2 do rzutu personality tego zwierzęcia.' },
  S: { name: 'Sturdy', description: '+5 slotów wyposażenia; bonus jest już uwzględniony w tabeli.' },
}

export const MOUNT_RARITY_LABEL: Record<MountRarity, string> = {
  C: 'Common',
  U: 'Uncommon',
  R: 'Rare',
  L: 'Legendary',
}

export const MOUNT_PERSONALITIES: Array<{
  value: MountPersonality
  label: string
  roll: string
  behavior: string
}> = [
  { value: 'horrid', label: 'Horrid', roll: '0–4', behavior: 'DISADV on morale; stubborn, mean' },
  { value: 'ornery', label: 'Ornery', roll: '5–7', behavior: 'Tolerates familiar rider; sassy, rude' },
  { value: 'reliable', label: 'Reliable', roll: '8–9', behavior: 'ADV on morale; protective, patient' },
  { value: 'lovely', label: 'Lovely', roll: '10+', behavior: 'Immune to morale; loyal, intelligent' },
]

export function mountPropertyText(properties: MountProperty[]): string {
  if (!properties.length) return '—'
  return properties
    .map(code => `${code} — ${MOUNT_PROPERTY_INFO[code].name}`)
    .join(' • ')
}

export function personalityLabel(value: Animal['personality']): string {
  return MOUNT_PERSONALITIES.find(item => item.value === value)?.label ?? 'Nieustalona'
}

export function personalityBehavior(value: Animal['personality']): string {
  return MOUNT_PERSONALITIES.find(item => item.value === value)?.behavior ?? ''
}
