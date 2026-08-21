export type CampaignRole = 'owner' | 'gm' | 'player'

export interface Campaign {
  id: string
  name: string
  description?: string | null
  createdAt: string
  createdBy?: string
  inviteCode?: string
  role?: CampaignRole
}

export interface CharacterSummary {
  id: string
  name: string
  kind: 'Postać' | 'NPC' | 'Zwierzę' | 'Wóz' | 'Siedziba'
  strength?: number
  usedSlots: number
  maxSlots: number
  gold?: number
}
