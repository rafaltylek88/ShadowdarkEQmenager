export type Campaign = {
  id: string
  name: string
  description?: string
  createdAt: string
}

export type CharacterSummary = {
  id: string
  name: string
  kind: 'Postać' | 'NPC' | 'Zwierzę' | 'Wóz' | 'Siedziba'
  strength?: number
  usedSlots: number
  maxSlots: number
  gold?: number
}
