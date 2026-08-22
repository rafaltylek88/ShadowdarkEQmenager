import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ArrowRightLeft,
  Backpack,
  Beef,
  Building2,
  Castle,
  Coins,
  Copy,
  Flame,
  Gauge,
  Home,
  KeyRound,
  Menu,
  Package,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Truck,
  Utensils,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

import { supabase, supabaseEnabled } from './lib/supabase'
import {
  createRemoteCampaign,
  joinCampaign,
  loadRemoteCampaigns,
} from './lib/campaigns'

import type { Campaign } from './types'
import {
  createCharacter,
  deleteCharacter,
  loadCharacters,
  updateCharacter,
} from './lib/characters'
import type { Character } from './lib/characters'
import { createNpc, deleteNpc, loadNpcs, updateNpc } from './lib/npcs'
import type { Npc } from './lib/npcs'
import { createNpcItem, deleteNpcItem, loadNpcItems, updateNpcItem } from './lib/npcItems'
import type { NpcItem } from './lib/npcItems'
import { createAnimal, deleteAnimal, loadAnimals, updateAnimal } from './lib/animals'
import type { Animal } from './lib/animals'
import {
  MOUNT_CATALOG,
  MOUNT_PERSONALITIES,
  MOUNT_PROPERTY_INFO,
  MOUNT_RARITY_LABEL,
  mountPropertyText,
  personalityBehavior,
  personalityLabel,
} from './lib/mountCatalog'
import type { MountCatalogEntry } from './lib/mountCatalog'
import { createAnimalItem, deleteAnimalItem, loadAnimalItems, updateAnimalItem } from './lib/animalItems'
import type { AnimalItem } from './lib/animalItems'
import {
  createItem,
  deleteItem,
  loadItems,
  updateItem,
} from './lib/items'
import type { CharacterItem, ItemCategory } from './lib/items'
import { createCatalogItem, deleteCatalogItem, loadCatalog } from './lib/catalog'
import type { CatalogItem, CatalogItemCategory } from './lib/catalog'
import {
  extinguishCampaignLight,
  loadCampaignLight,
  pauseCampaignLight,
  resumeCampaignLight,
  startCampaignLight,
  transferCampaignLight,
} from './lib/light'
import type { CampaignLight, LightMemberType } from './lib/light'
import { feedAnimals, feedExpedition, transferMemberRation } from './lib/rations'
import type { AnimalFeedMethod, MemberType } from './lib/rations'

const initialCampaigns: Campaign[] = [
  {
    id: 'demo-1',
    name: 'Cienie Królestwa',
    description: 'Kampania demonstracyjna',
    createdAt: new Date().toISOString(),
    inviteCode: 'DEMO123456',
    role: 'owner',
  },
  {
    id: 'demo-2',
    name: 'Krypta Czarnego Słońca',
    description: 'Druga kampania',
    createdAt: new Date().toISOString(),
    inviteCode: 'DEMO654321',
    role: 'gm',
  },
]

const nav = [
  ['Dashboard', Gauge],
  ['Postacie', Users],
  ['NPC', Shield],
  ['Zwierzęta', Beef],
  ['Siedziby', Castle],
  ['Ekwipunek wspólny', Backpack],
  ['Biblioteka', Package],
  ['Podsumowanie', Coins],
] as const

function readLocalCampaigns(): Campaign[] {
  try {
    const saved = localStorage.getItem('sdm.campaigns')
    return saved ? JSON.parse(saved) : initialCampaigns
  } catch {
    return initialCampaigns
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(supabaseEnabled)

  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    readLocalCampaigns()
  )

  const [campaignsLoading, setCampaignsLoading] = useState(false)

  const [activeId, setActiveId] = useState(
    () =>
      localStorage.getItem('sdm.activeCampaign') ||
      readLocalCampaigns()[0]?.id
  )

  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  const [newCampaign, setNewCampaign] = useState('')
  const [joinCode, setJoinCode] = useState('')

  const [mobileNav, setMobileNav] = useState(false)
  const [activeView, setActiveView] = useState<(typeof nav)[number][0]>('Dashboard')

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [characters, setCharacters] = useState<Character[]>([])
  const [charactersLoading, setCharactersLoading] = useState(false)
  const [showCharacter, setShowCharacter] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [characterName, setCharacterName] = useState('')
  const [characterStrength, setCharacterStrength] = useState(10)
  const [characterGold, setCharacterGold] = useState(0)

  const [npcs, setNpcs] = useState<Npc[]>([])
  const [npcsLoading, setNpcsLoading] = useState(false)
  const [showNpc, setShowNpc] = useState(false)
  const [editingNpc, setEditingNpc] = useState<Npc | null>(null)
  const [npcName, setNpcName] = useState('')
  const [npcRole, setNpcRole] = useState('')
  const [npcMaxSlots, setNpcMaxSlots] = useState(10)

  const [npcItems, setNpcItems] = useState<NpcItem[]>([])
  const [npcItemsLoading, setNpcItemsLoading] = useState(false)
  const [showNpcItem, setShowNpcItem] = useState(false)
  const [editingNpcItem, setEditingNpcItem] = useState<NpcItem | null>(null)
  const [npcItemNpcId, setNpcItemNpcId] = useState('')
  const [npcItemCatalogItemId, setNpcItemCatalogItemId] = useState('')
  const [npcItemName, setNpcItemName] = useState('')
  const [npcItemQuantity, setNpcItemQuantity] = useState(1)
  const [npcItemSlotsPerUnit, setNpcItemSlotsPerUnit] = useState(1)
  const [npcItemSlotGroupSize, setNpcItemSlotGroupSize] = useState(1)
  const [npcItemFreeQuantity, setNpcItemFreeQuantity] = useState(0)
  const [npcItemCategory, setNpcItemCategory] = useState<ItemCategory>('normal')
  const [npcItemLightMinutes, setNpcItemLightMinutes] = useState(60)
  const [npcItemWeaponDamage, setNpcItemWeaponDamage] = useState('')
  const [npcItemWeaponRange, setNpcItemWeaponRange] = useState('')
  const [npcItemWeaponProperties, setNpcItemWeaponProperties] = useState('')
  const [npcItemArmorClass, setNpcItemArmorClass] = useState('')
  const [npcItemArmorProperties, setNpcItemArmorProperties] = useState('')

  const [animals, setAnimals] = useState<Animal[]>([])
  const [animalsLoading, setAnimalsLoading] = useState(false)
  const [showAnimal, setShowAnimal] = useState(false)
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null)
  const [animalName, setAnimalName] = useState('')
  const [animalType, setAnimalType] = useState('')
  const [animalBaseSlots, setAnimalBaseSlots] = useState(10)
  const [animalPersonality, setAnimalPersonality] = useState<Animal['personality']>('')
  const [selectedMountCatalogName, setSelectedMountCatalogName] = useState('')

  const [animalItems, setAnimalItems] = useState<AnimalItem[]>([])
  const [animalItemsLoading, setAnimalItemsLoading] = useState(false)
  const [showAnimalItem, setShowAnimalItem] = useState(false)
  const [editingAnimalItem, setEditingAnimalItem] = useState<AnimalItem | null>(null)
  const [animalItemAnimalId, setAnimalItemAnimalId] = useState('')
  const [animalItemCatalogItemId, setAnimalItemCatalogItemId] = useState('')
  const [animalItemName, setAnimalItemName] = useState('')
  const [animalItemQuantity, setAnimalItemQuantity] = useState(1)
  const [animalItemSlotsPerUnit, setAnimalItemSlotsPerUnit] = useState(1)
  const [animalItemSlotGroupSize, setAnimalItemSlotGroupSize] = useState(1)
  const [animalItemFreeQuantity, setAnimalItemFreeQuantity] = useState(0)
  const [animalItemCategory, setAnimalItemCategory] = useState<ItemCategory>('normal')
  const [animalItemLightMinutes, setAnimalItemLightMinutes] = useState(60)
  const [animalItemWeaponDamage, setAnimalItemWeaponDamage] = useState('')
  const [animalItemWeaponRange, setAnimalItemWeaponRange] = useState('')
  const [animalItemWeaponProperties, setAnimalItemWeaponProperties] = useState('')
  const [animalItemArmorClass, setAnimalItemArmorClass] = useState('')
  const [animalItemArmorProperties, setAnimalItemArmorProperties] = useState('')

  const [items, setItems] = useState<CharacterItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [showItem, setShowItem] = useState(false)
  const [editingItem, setEditingItem] = useState<CharacterItem | null>(null)
  const [itemCharacterId, setItemCharacterId] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemSlotsPerUnit, setItemSlotsPerUnit] = useState(1)
  const [itemSlotGroupSize, setItemSlotGroupSize] = useState(1)
  const [itemFreeQuantity, setItemFreeQuantity] = useState(0)
  const [itemCategory, setItemCategory] = useState<ItemCategory>('normal')
  const [itemLightMinutes, setItemLightMinutes] = useState(60)
  const [itemCatalogItemId, setItemCatalogItemId] = useState('')
  const [itemWeaponDamage, setItemWeaponDamage] = useState('')
  const [itemWeaponRange, setItemWeaponRange] = useState('')
  const [itemWeaponProperties, setItemWeaponProperties] = useState('')
  const [itemArmorClass, setItemArmorClass] = useState('')
  const [itemArmorProperties, setItemArmorProperties] = useState('')

  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [showCatalogItem, setShowCatalogItem] = useState(false)
  const [catalogName, setCatalogName] = useState('')
  const [catalogSlotsPerUnit, setCatalogSlotsPerUnit] = useState(1)
  const [catalogSlotGroupSize, setCatalogSlotGroupSize] = useState(1)
  const [catalogFreeQuantity, setCatalogFreeQuantity] = useState(0)
  const [catalogCategory, setCatalogCategory] = useState<CatalogItemCategory>('normal')
  const [catalogLightMinutes, setCatalogLightMinutes] = useState(60)
  const [catalogWeaponDamage, setCatalogWeaponDamage] = useState('')
  const [catalogWeaponRange, setCatalogWeaponRange] = useState('')
  const [catalogWeaponProperties, setCatalogWeaponProperties] = useState('')
  const [catalogArmorClass, setCatalogArmorClass] = useState('')
  const [catalogArmorProperties, setCatalogArmorProperties] = useState('')
  const [catalogIsMagical, setCatalogIsMagical] = useState(false)
  const [catalogMagicDescription, setCatalogMagicDescription] = useState('')
  const [showCatalogImport, setShowCatalogImport] = useState(false)
  const [catalogImportText, setCatalogImportText] = useState('')

  const [lightState, setLightState] = useState<CampaignLight | null>(null)
  const [lightLoading, setLightLoading] = useState(false)
  const [lightCharacterId, setLightCharacterId] = useState('')
  const [lightItemId, setLightItemId] = useState('')
  const [lightTransferCharacterId, setLightTransferCharacterId] = useState('')
  const [lightNow, setLightNow] = useState(() => Date.now())
  const [feedingExpedition, setFeedingExpedition] = useState(false)
  const [feedingAnimals, setFeedingAnimals] = useState(false)
  const [animalFeedMethod, setAnimalFeedMethod] = useState<AnimalFeedMethod>('ration')
  const [transferringRation, setTransferringRation] = useState(false)
  const [rationTransferFromKey, setRationTransferFromKey] = useState('')
  const [rationTransferToKey, setRationTransferToKey] = useState('')

  const isCloudMode = Boolean(supabaseEnabled && session)

  const refreshCampaigns = useCallback(async () => {
    if (!isCloudMode) return

    setCampaignsLoading(true)

    try {
      const remote = await loadRemoteCampaigns()

      setCampaigns(remote)

      setActiveId(current =>
        remote.some(c => c.id === current)
          ? current
          : remote[0]?.id
      )

      setError(null)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Nie udało się pobrać kampanii.'
      )
    } finally {
      setCampaignsLoading(false)
    }
  }, [isCloudMode])

  const refreshCharacters = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setCharacters([])
      return
    }

    setCharactersLoading(true)

    try {
      const remote = await loadCharacters(activeId)
      setCharacters(remote)
    } catch (e: any) {
      console.error('LOAD CHARACTERS ERROR:', e)
      setError(e?.message || e?.details || 'Nie udało się pobrać postaci.')
    } finally {
      setCharactersLoading(false)
    }
  }, [activeId, isCloudMode])

  const refreshNpcs = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setNpcs([])
      return
    }

    setNpcsLoading(true)
    try {
      setNpcs(await loadNpcs(activeId))
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się pobrać NPC.')
    } finally {
      setNpcsLoading(false)
    }
  }, [activeId, isCloudMode])

  const refreshNpcItems = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setNpcItems([])
      return
    }

    setNpcItemsLoading(true)
    try {
      setNpcItems(await loadNpcItems(activeId))
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się pobrać ekwipunku NPC.')
    } finally {
      setNpcItemsLoading(false)
    }
  }, [activeId, isCloudMode])


  const refreshAnimals = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setAnimals([])
      return
    }

    setAnimalsLoading(true)
    try {
      setAnimals(await loadAnimals(activeId))
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się pobrać zwierząt.')
    } finally {
      setAnimalsLoading(false)
    }
  }, [activeId, isCloudMode])

  const refreshAnimalItems = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setAnimalItems([])
      return
    }

    setAnimalItemsLoading(true)
    try {
      setAnimalItems(await loadAnimalItems(activeId))
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się pobrać ekwipunku zwierząt.')
    } finally {
      setAnimalItemsLoading(false)
    }
  }, [activeId, isCloudMode])

  const refreshItems = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setItems([])
      return
    }

    setItemsLoading(true)

    try {
      const remote = await loadItems(activeId)
      setItems(remote)
    } catch (e: any) {
      console.error('LOAD ITEMS ERROR:', e)
      setError(e?.message || e?.details || 'Nie udało się pobrać ekwipunku.')
    } finally {
      setItemsLoading(false)
    }
  }, [activeId, isCloudMode])

  const refreshCatalog = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setCatalog([])
      return
    }

    setCatalogLoading(true)
    try {
      setCatalog(await loadCatalog(activeId))
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się pobrać katalogu.')
    } finally {
      setCatalogLoading(false)
    }
  }, [activeId, isCloudMode])

  const refreshLight = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setLightState(null)
      return
    }

    setLightLoading(true)
    try {
      setLightState(await loadCampaignLight(activeId))
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się pobrać stanu światła.')
    } finally {
      setLightLoading(false)
    }
  }, [activeId, isCloudMode])


  /*
   * Supabase uruchamia anonimową sesję.
   * Użytkownik nie musi się logować ani rejestrować.
   */
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return
    }

    const sb = supabase

    async function initializeAnonymousSession() {
      try {
        const { data, error } = await sb.auth.getSession()

        if (error) {
          throw error
        }

        if (data.session) {
          setSession(data.session)
          setAuthLoading(false)
          return
        }

        const { data: anonymousData, error: anonymousError } =
          await sb.auth.signInAnonymously()

        if (anonymousError) {
          throw anonymousError
        }

        setSession(anonymousData.session)
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : 'Nie udało się uruchomić anonimowej sesji.'
        )
      } finally {
        setAuthLoading(false)
      }
    }

    initializeAnonymousSession()

    const { data: listener } =
      sb.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession)
        setAuthLoading(false)
      })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  /*
   * Po uzyskaniu anonimowej sesji pobieramy kampanie z Supabase.
   */
  useEffect(() => {
    if (isCloudMode) {
      refreshCampaigns()
      return
    }

    if (supabaseEnabled && authLoading) {
      return
    }

    const local = readLocalCampaigns()

    setCampaigns(local)

    setActiveId(current =>
      local.some(c => c.id === current)
        ? current
        : local[0]?.id
    )
  }, [
    isCloudMode,
    refreshCampaigns,
    authLoading,
  ])

  /*
   * Tryb lokalny działa tylko wtedy, gdy Supabase nie jest skonfigurowany.
   */
  useEffect(() => {
    if (isCloudMode || supabaseEnabled || !campaigns.length) {
      return
    }

    localStorage.setItem(
      'sdm.campaigns',
      JSON.stringify(campaigns)
    )
  }, [campaigns, isCloudMode])

  useEffect(() => {
    if (activeId) {
      localStorage.setItem(
        'sdm.activeCampaign',
        activeId
      )
    }
  }, [activeId])

  /*
   * Realtime — odświeżenie listy kampanii,
   * gdy ktoś dołączy lub utworzy kampanię.
   */
  useEffect(() => {
    if (!supabase || !session) return

    const sb = supabase

    const channel = sb
      .channel(
        `campaign-list-${session.user.id}`
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
        },
        refreshCampaigns
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_members',
        },
        refreshCampaigns
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, refreshCampaigns])

  useEffect(() => {
    refreshCharacters()
  }, [refreshCharacters])

  useEffect(() => {
    refreshNpcs()
  }, [refreshNpcs])

  useEffect(() => {
    refreshNpcItems()
  }, [refreshNpcItems])

  useEffect(() => {
    refreshAnimals()
  }, [refreshAnimals])

  useEffect(() => {
    refreshAnimalItems()
  }, [refreshAnimalItems])

  useEffect(() => {
    refreshItems()
  }, [refreshItems])

  useEffect(() => {
    refreshCatalog()
  }, [refreshCatalog])

  useEffect(() => {
    refreshLight()
  }, [refreshLight])

  useEffect(() => {
    if (!supabase || !session || !activeId) return

    const sb = supabase

    const channel = sb
      .channel(`characters-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'characters',
          filter: `campaign_id=eq.${activeId}`,
        },
        () => {
          refreshCharacters()
        }
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshCharacters])

  useEffect(() => {
    if (!supabase || !session || !activeId) return
    const sb = supabase

    const channel = sb
      .channel(`npcs-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'npcs',
          filter: `campaign_id=eq.${activeId}`,
        },
        () => {
          refreshNpcs()
        }
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshNpcs])

  useEffect(() => {
    if (!supabase || !session || !activeId) return
    const sb = supabase

    const channel = sb
      .channel(`npc-items-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'npc_items',
          filter: `campaign_id=eq.${activeId}`,
        },
        () => {
          refreshNpcItems()
          refreshNpcs()
        }
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshNpcItems, refreshNpcs])

  useEffect(() => {
    if (!supabase || !session || !activeId) return
    const sb = supabase

    const channel = sb
      .channel(`animals-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'animals',
          filter: `campaign_id=eq.${activeId}`,
        },
        refreshAnimals
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshAnimals])

  useEffect(() => {
    if (!supabase || !session || !activeId) return
    const sb = supabase

    const channel = sb
      .channel(`animal-items-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'animal_items',
          filter: `campaign_id=eq.${activeId}`,
        },
        () => {
          refreshAnimalItems()
          refreshAnimals()
        }
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshAnimalItems, refreshAnimals])



  useEffect(() => {
    if (!supabase || !session || !activeId) return

    const sb = supabase

    const channel = sb
      .channel(`items-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_items',
          filter: `campaign_id=eq.${activeId}`,
        },
        () => {
          refreshItems()
          refreshCharacters()
        }
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshItems, refreshCharacters])

  useEffect(() => {
    if (!supabase || !session || !activeId) return
    const sb = supabase

    const channel = sb
      .channel(`catalog-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'item_catalog',
          filter: `campaign_id=eq.${activeId}`,
        },
        refreshCatalog
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshCatalog])

  useEffect(() => {
    if (!supabase || !session || !activeId) return

    const sb = supabase
    const channel = sb
      .channel(`light-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_light',
          filter: `campaign_id=eq.${activeId}`,
        },
        refreshLight
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshLight])


  const active =
    campaigns.find(c => c.id === activeId) ??
    campaigns[0]

  const slotUsageForItem = useCallback(
    (item: CharacterItem) => {
      const quantity = Math.max(0, item.quantity - (item.freeQuantity ?? 0))
      if (quantity <= 0) return 0

      const groupSize = Math.max(1, item.slotGroupSize ?? 1)
      return Math.ceil(quantity / groupSize) * item.slotsPerUnit
    },
    []
  )

  const characterSlots = useMemo(() => {
    const max = characters.reduce(
      (sum, character) => sum + Math.max(10, character.strength),
      0
    )

    const used = items.reduce((sum, item) => sum + slotUsageForItem(item), 0)

    return { used, max }
  }, [characters, items, slotUsageForItem])

  const usedSlotsForCharacter = useCallback(
    (characterId: string) =>
      items
        .filter(item => item.characterId === characterId)
        .reduce((sum, item) => sum + slotUsageForItem(item), 0),
    [items, slotUsageForItem]
  )

  const itemsForCharacter = useCallback(
    (characterId: string) =>
      items.filter(item => item.characterId === characterId),
    [items]
  )


  const slotUsageForNpcItem = useCallback((item: NpcItem) => {
    const quantity = Math.max(0, item.quantity - (item.freeQuantity ?? 0))
    if (quantity <= 0) return 0
    const groupSize = Math.max(1, item.slotGroupSize ?? 1)
    return Math.ceil(quantity / groupSize) * item.slotsPerUnit
  }, [])

  const usedSlotsForNpc = useCallback(
    (npcId: string) =>
      npcItems
        .filter(item => item.npcId === npcId)
        .reduce((sum, item) => sum + slotUsageForNpcItem(item), 0),
    [npcItems, slotUsageForNpcItem]
  )

  const itemsForNpc = useCallback(
    (npcId: string) => npcItems.filter(item => item.npcId === npcId),
    [npcItems]
  )


  const normalizeSpecialItemName = useCallback(
    (value: string) =>
      value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ''),
    []
  )

  const isWagonName = useCallback(
    (value: string) =>
      ['wagon', 'woz'].includes(normalizeSpecialItemName(value)),
    [normalizeSpecialItemName]
  )

  const isSaddleName = useCallback(
    (value: string) =>
      ['saddle', 'siodlo'].includes(normalizeSpecialItemName(value)),
    [normalizeSpecialItemName]
  )

  const animalHasWagon = useCallback(
    (animalId: string) =>
      animalItems.some(
        item => item.animalId === animalId && isWagonName(item.name)
      ),
    [animalItems, isWagonName]
  )

  const wagonBonusForAnimal = useCallback(
    (animalId: string) => (animalHasWagon(animalId) ? 15 : 0),
    [animalHasWagon]
  )

  const animalMaxSlots = useCallback(
    (animal: Animal) => animal.baseSlots + wagonBonusForAnimal(animal.id),
    [wagonBonusForAnimal]
  )

  const slotUsageForAnimalItem = useCallback(
    (item: AnimalItem) => {
      if (isWagonName(item.name)) return 0

      const extraFree = isSaddleName(item.name) ? 1 : 0
      const quantity = Math.max(
        0,
        item.quantity - Math.max(item.freeQuantity ?? 0, extraFree)
      )
      if (quantity <= 0) return 0

      const groupSize = Math.max(1, item.slotGroupSize ?? 1)
      return Math.ceil(quantity / groupSize) * item.slotsPerUnit
    },
    [isSaddleName, isWagonName]
  )

  const usedSlotsForAnimal = useCallback(
    (animalId: string) =>
      animalItems
        .filter(item => item.animalId === animalId)
        .reduce((sum, item) => sum + slotUsageForAnimalItem(item), 0),
    [animalItems, slotUsageForAnimalItem]
  )

  const itemsForAnimal = useCallback(
    (animalId: string) =>
      animalItems.filter(item => item.animalId === animalId),
    [animalItems]
  )


  const expeditionSlots = useMemo(() => {
    const npcUsed = npcs.reduce(
      (sum, npc) => sum + usedSlotsForNpc(npc.id),
      0
    )
    const npcMax = npcs.reduce(
      (sum, npc) => sum + npc.maxSlots,
      0
    )

    const animalUsed = animals.reduce(
      (sum, animal) => sum + usedSlotsForAnimal(animal.id),
      0
    )
    const animalMax = animals.reduce(
      (sum, animal) => sum + animalMaxSlots(animal),
      0
    )

    return {
      used: characterSlots.used + npcUsed + animalUsed,
      max: characterSlots.max + npcMax + animalMax,
    }
  }, [
    characterSlots,
    npcs,
    animals,
    usedSlotsForNpc,
    usedSlotsForAnimal,
    animalMaxSlots,
  ])

  const inventoryHighlightStyle = useCallback(
    (category: ItemCategory, isMagical = false) => {
      if (isMagical) {
        return {
          border: '1px solid rgba(72, 118, 164, 0.82)',
          borderRadius: 8,
          padding: '10px 12px',
          alignItems: 'center',
          background:
            'linear-gradient(135deg, rgba(55, 91, 132, 0.25), rgba(43, 62, 92, 0.18))',
          boxShadow:
            'inset 0 0 0 1px rgba(145, 190, 232, 0.10)',
        }
      }

      if (category === 'light') {
        return {
          border: '1px solid rgba(196, 154, 48, 0.72)',
          borderRadius: 8,
          padding: '10px 12px',
          alignItems: 'center',
          background:
            'linear-gradient(135deg, rgba(173, 132, 32, 0.20), rgba(92, 76, 35, 0.16))',
          boxShadow:
            'inset 0 0 0 1px rgba(242, 208, 102, 0.08)',
        }
      }

      if (category === 'food') {
        return {
          border: '1px solid rgba(78, 122, 65, 0.75)',
          borderRadius: 8,
          padding: '10px 12px',
          alignItems: 'center',
          background:
            'linear-gradient(135deg, rgba(64, 104, 56, 0.22), rgba(50, 78, 47, 0.16))',
          boxShadow:
            'inset 0 0 0 1px rgba(142, 181, 110, 0.08)',
        }
      }

      return {
        borderTop: '1px solid rgba(180, 135, 60, 0.25)',
        paddingTop: 8,
        alignItems: 'center',
      }
    },
    []
  )

  const catalogEntryForItem = useCallback(
    (catalogItemId: string | null) =>
      catalogItemId
        ? catalog.find(entry => entry.id === catalogItemId) ?? null
        : null,
    [catalog]
  )

  const isMagicalInventoryItem = useCallback(
    (catalogItemId: string | null) =>
      Boolean(catalogEntryForItem(catalogItemId)?.isMagical),
    [catalogEntryForItem]
  )

  const magicDescriptionForItem = useCallback(
    (catalogItemId: string | null) =>
      catalogEntryForItem(catalogItemId)?.magicDescription ?? null,
    [catalogEntryForItem]
  )

  const animalCoins = useMemo(() => {
    return animalItems.reduce((sum, item) => {
      const catalogName = catalogEntryForItem(item.catalogItemId)?.name ?? ''
      const itemKey = normalizeInventoryName(item.name)
      const catalogKey = normalizeInventoryName(catalogName)

      if (
        ['coin', 'coins'].includes(itemKey) ||
        ['coin', 'coins'].includes(catalogKey)
      ) {
        return sum + item.quantity
      }

      return sum
    }, 0)
  }, [animalItems, catalogEntryForItem])

  const totalGold = useMemo(
    () =>
      characters.reduce((sum, character) => sum + character.gold, 0) +
      animalCoins,
    [characters, animalCoins]
  )


  function normalizeInventoryName(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
  }

  function isRationName(name: string, catalogItemId: string | null) {
    const itemName = normalizeInventoryName(name)
    const catalogName = normalizeInventoryName(
      catalog.find(entry => entry.id === catalogItemId)?.name ?? ''
    )

    return ['ration', 'rations', 'racja', 'racje'].includes(
      itemName || catalogName
    )
  }

  const characterRationCounts = useMemo(() => {
    const counts = new Map<string, number>()
    characters.forEach(character => counts.set(character.id, 0))

    for (const item of items) {
      if (item.category !== 'food' || !isRationName(item.name, item.catalogItemId)) continue
      counts.set(item.characterId, (counts.get(item.characterId) ?? 0) + item.quantity)
    }

    return counts
  }, [characters, items, catalog])

  const npcRationCounts = useMemo(() => {
    const counts = new Map<string, number>()
    npcs.forEach(npc => counts.set(npc.id, 0))

    for (const item of npcItems) {
      if (item.category !== 'food' || !isRationName(item.name, item.catalogItemId)) continue
      counts.set(item.npcId, (counts.get(item.npcId) ?? 0) + item.quantity)
    }

    return counts
  }, [npcs, npcItems, catalog])


  const animalRationCounts = useMemo(() => {
    const counts = new Map<string, number>()
    animals.forEach(animal => counts.set(animal.id, 0))

    for (const item of animalItems) {
      if (item.category !== 'food' || !isRationName(item.name, item.catalogItemId)) continue
      counts.set(item.animalId, (counts.get(item.animalId) ?? 0) + item.quantity)
    }

    return counts
  }, [animals, animalItems, catalog])

  const animalsMissingRations = useMemo(
    () => animals.filter(animal => (animalRationCounts.get(animal.id) ?? 0) < 1),
    [animals, animalRationCounts]
  )

  type ExpeditionMember = {
    key: string
    type: MemberType
    id: string
    name: string
    rationCount: number
    usedSlots: number
    maxSlots: number
  }

  const expeditionMembers = useMemo<ExpeditionMember[]>(
    () => [
      ...characters.map(character => ({
        key: `character:${character.id}`,
        type: 'character' as MemberType,
        id: character.id,
        name: character.name,
        rationCount: characterRationCounts.get(character.id) ?? 0,
        usedSlots: usedSlotsForCharacter(character.id),
        maxSlots: Math.max(10, character.strength),
      })),
      ...npcs.map(npc => ({
        key: `npc:${npc.id}`,
        type: 'npc' as MemberType,
        id: npc.id,
        name: npc.name,
        rationCount: npcRationCounts.get(npc.id) ?? 0,
        usedSlots: usedSlotsForNpc(npc.id),
        maxSlots: npc.maxSlots,
      })),
    ],
    [
      characters,
      npcs,
      characterRationCounts,
      npcRationCounts,
      usedSlotsForCharacter,
      usedSlotsForNpc,
    ]
  )

  const totalRations = useMemo(
    () => expeditionMembers.reduce((sum, member) => sum + member.rationCount, 0),
    [expeditionMembers]
  )

  const expeditionFeedsAvailable = useMemo(() => {
    if (!expeditionMembers.length) return 0
    return Math.floor(totalRations / expeditionMembers.length)
  }, [expeditionMembers.length, totalRations])

  const membersMissingRations = useMemo(
    () => expeditionMembers.filter(member => member.rationCount < 1),
    [expeditionMembers]
  )

  const rationDonors = useMemo(
    () =>
      expeditionMembers
        .filter(member => member.rationCount > 1)
        .sort((a, b) => b.rationCount - a.rationCount),
    [expeditionMembers]
  )

  useEffect(() => {
    if (!membersMissingRations.some(member => member.key === rationTransferToKey)) {
      setRationTransferToKey(membersMissingRations[0]?.key ?? '')
    }

    if (!rationDonors.some(member => member.key === rationTransferFromKey)) {
      setRationTransferFromKey(rationDonors[0]?.key ?? '')
    }
  }, [
    membersMissingRations,
    rationDonors,
    rationTransferFromKey,
    rationTransferToKey,
  ])

  async function handleTransferRation() {
    if (!activeId || !rationTransferFromKey || !rationTransferToKey) {
      setError('Wybierz dawcę i odbiorcę racji.')
      return
    }

    const from = expeditionMembers.find(member => member.key === rationTransferFromKey)
    const to = expeditionMembers.find(member => member.key === rationTransferToKey)

    if (!from || !to) {
      setError('Nie znaleziono dawcy lub odbiorcy.')
      return
    }

    setTransferringRation(true)

    try {
      await transferMemberRation(activeId, from.type, from.id, to.type, to.id)
      await Promise.all([
        refreshItems(),
        refreshCharacters(),
        refreshNpcItems(),
        refreshNpcs(),
      ])
      flash(`Przekazano 1 rację: ${from.name} → ${to.name}.`)
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się przekazać racji.')
    } finally {
      setTransferringRation(false)
    }
  }

  function formatLastFed(value: string | null) {
    if (!value) return 'Nigdy'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Brak danych'

    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function handleFeedAnimals() {
    if (!activeId) {
      setError('Najpierw wybierz kampanię.')
      return
    }

    if (!animals.length) {
      setError('W kampanii nie ma zwierząt do nakarmienia.')
      return
    }

    setFeedingAnimals(true)

    try {
      const result = await feedAnimals(activeId, animalFeedMethod)
      await Promise.all([refreshAnimalItems(), refreshAnimals()])

      flash(
        result.method === 'pasture'
          ? `Nakarmiono ${result.animalsFed} zwierząt na pastwisku. Racje nie zostały zużyte.`
          : `Nakarmiono ${result.animalsFed} zwierząt racjami. Każde zużyło 1 własną rację.`
      )
    } catch (e: any) {
      setError(
        e?.message ||
          e?.details ||
          'Nie udało się nakarmić zwierząt.'
      )
    } finally {
      setFeedingAnimals(false)
    }
  }

  async function handleFeedExpedition() {
    if (!activeId) {
      setError('Najpierw wybierz kampanię.')
      return
    }

    if (!characters.length) {
      setError('W kampanii nie ma postaci do nakarmienia.')
      return
    }

    setFeedingExpedition(true)

    try {
      const result = await feedExpedition(activeId)
      await Promise.all([
        refreshItems(),
        refreshCharacters(),
        refreshNpcItems(),
        refreshNpcs(),
      ])
      flash(
        `Nakarmiono ekspedycję: ${result.membersFed} ${
          result.membersFed === 1 ? 'członek' : 'członków'
        }.`
      )
    } catch (e: any) {
      console.error('FEED EXPEDITION ERROR:', e)
      setError(
        e?.message ||
          e?.details ||
          'Nie udało się nakarmić całej ekspedycji.'
      )
    } finally {
      setFeedingExpedition(false)
    }
  }

  type LightChoice = {
    key: string
    memberType: LightMemberType
    memberId: string
    memberName: string
    itemId: string
    itemName: string
    quantity: number
    lightMinutes: number
    catalogItemId: string | null
  }

  const availableLightChoices = useMemo<LightChoice[]>(
    () => [
      ...items
        .filter(
          item =>
            item.category === 'light' &&
            !item.isActiveLight &&
            item.quantity > 0 &&
            (item.lightMinutes ?? 0) > 0
        )
        .map(item => ({
          key: `character:${item.characterId}:${item.id}`,
          memberType: 'character' as LightMemberType,
          memberId: item.characterId,
          memberName:
            characters.find(character => character.id === item.characterId)?.name ??
            'Postać',
          itemId: item.id,
          itemName: item.name,
          quantity: item.quantity,
          lightMinutes: item.lightMinutes ?? 0,
          catalogItemId: item.catalogItemId,
        })),
      ...npcItems
        .filter(
          item =>
            item.category === 'light' &&
            !item.isActiveLight &&
            item.quantity > 0 &&
            (item.lightMinutes ?? 0) > 0
        )
        .map(item => ({
          key: `npc:${item.npcId}:${item.id}`,
          memberType: 'npc' as LightMemberType,
          memberId: item.npcId,
          memberName: npcs.find(npc => npc.id === item.npcId)?.name ?? 'NPC',
          itemId: item.id,
          itemName: item.name,
          quantity: item.quantity,
          lightMinutes: item.lightMinutes ?? 0,
          catalogItemId: item.catalogItemId,
        })),
    ],
    [items, characters, npcItems, npcs]
  )

  const lightCarrierChoices = useMemo(() => {
    const map = new Map<string, { key: string; type: LightMemberType; id: string; name: string }>()

    for (const choice of availableLightChoices) {
      const key = `${choice.memberType}:${choice.memberId}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          type: choice.memberType,
          id: choice.memberId,
          name: choice.memberName,
        })
      }
    }

    return Array.from(map.values())
  }, [availableLightChoices])

  const lightItemsForSelectedMember = useMemo(() => {
    const [memberType, memberId] = lightCharacterId.split(':')
    return availableLightChoices.filter(
      choice => choice.memberType === memberType && choice.memberId === memberId
    )
  }, [availableLightChoices, lightCharacterId])

  const lightRemainingSeconds = useMemo(() => {
    if (!lightState || lightState.status === 'off') return 0
    if (lightState.status === 'paused' || !lightState.startedAt) {
      return Math.max(0, lightState.remainingSeconds)
    }

    const elapsed = Math.floor(
      (lightNow - new Date(lightState.startedAt).getTime()) / 1000
    )

    return Math.max(0, lightState.remainingSeconds - elapsed)
  }, [lightState, lightNow])

  const lightIsActive = Boolean(
    lightState && lightState.status !== 'off' && lightRemainingSeconds > 0
  )

  const selectedLightChoice =
    lightItemsForSelectedMember.find(choice => choice.itemId === lightItemId) ?? null

  const lightCarrierName =
    lightState?.carrierName ||
    selectedLightChoice?.memberName ||
    '—'

  const lightSourceName =
    lightState?.sourceName ||
    selectedLightChoice?.itemName ||
    '—'

  const lightFuelStatusForChoice = useCallback(
    (choice: LightChoice) => {
      const rule = catalog.find(entry => entry.id === choice.catalogItemId) ?? null
      if (!rule || rule.lightConsumesSource || !rule.lightFuelItemName) return null

      const normalizeName = (value: string) =>
        value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

      const fuelCatalogIds = new Set(
        catalog
          .filter(
            entry =>
              normalizeName(entry.name) === normalizeName(rule.lightFuelItemName!)
          )
          .map(entry => entry.id)
      )

      const expectedName = normalizeName(rule.lightFuelItemName)

      const available =
        choice.memberType === 'character'
          ? items
              .filter(candidate => {
                if (candidate.characterId !== choice.memberId) return false
                if (
                  candidate.catalogItemId &&
                  fuelCatalogIds.has(candidate.catalogItemId)
                ) {
                  return true
                }
                return normalizeName(candidate.name) === expectedName
              })
              .reduce((sum, candidate) => sum + candidate.quantity, 0)
          : npcItems
              .filter(candidate => {
                if (candidate.npcId !== choice.memberId) return false
                if (
                  candidate.catalogItemId &&
                  fuelCatalogIds.has(candidate.catalogItemId)
                ) {
                  return true
                }
                return normalizeName(candidate.name) === expectedName
              })
              .reduce((sum, candidate) => sum + candidate.quantity, 0)

      return {
        name: rule.lightFuelItemName,
        required: Math.max(1, rule.lightFuelQuantity || 1),
        available,
      }
    },
    [items, npcItems, catalog]
  )

  const selectedLightFuel = selectedLightChoice
    ? lightFuelStatusForChoice(selectedLightChoice)
    : null

  const selectedLightMissingFuel = Boolean(
    selectedLightFuel &&
      selectedLightFuel.available < selectedLightFuel.required
  )

  const expeditionCarrierOptions = useMemo(
    () => [
      ...characters.map(character => ({
        key: `character:${character.id}`,
        type: 'character' as LightMemberType,
        id: character.id,
        name: character.name,
      })),
      ...npcs.map(npc => ({
        key: `npc:${npc.id}`,
        type: 'npc' as LightMemberType,
        id: npc.id,
        name: npc.name,
      })),
    ],
    [characters, npcs]
  )

  const activeLightCarrierKey =
    lightState?.carrierType === 'npc' && lightState.npcId
      ? `npc:${lightState.npcId}`
      : lightState?.characterId
        ? `character:${lightState.characterId}`
        : ''

  function formatTimer(totalSeconds: number) {
    const safe = Math.max(0, Math.floor(totalSeconds))
    const hours = Math.floor(safe / 3600)
    const minutes = Math.floor((safe % 3600) / 60)
    const seconds = safe % 60

    return [hours, minutes, seconds]
      .map(value => String(value).padStart(2, '0'))
      .join(':')
  }

  useEffect(() => {
    if (lightState?.status === 'running') {
      const id = window.setInterval(() => setLightNow(Date.now()), 1000)
      return () => window.clearInterval(id)
    }
  }, [lightState?.status, lightState?.startedAt])

  useEffect(() => {
    if (
      !activeId ||
      lightState?.status !== 'running' ||
      lightRemainingSeconds > 0
    ) {
      return
    }

    extinguishCampaignLight(activeId)
      .then(async next => {
        setLightState(next)
        await Promise.all([
          refreshItems(),
          refreshCharacters(),
          refreshNpcItems(),
          refreshNpcs(),
        ])
      })
      .catch(() => undefined)
  }, [
    activeId,
    lightState?.status,
    lightRemainingSeconds,
    refreshItems,
    refreshCharacters,
    refreshNpcItems,
    refreshNpcs,
  ])

  useEffect(() => {
    if (lightState?.status === 'running' || lightState?.status === 'paused') return

    setLightCharacterId(current => {
      if (lightCarrierChoices.some(member => member.key === current)) return current
      return lightCarrierChoices[0]?.key ?? ''
    })
  }, [lightCarrierChoices, lightState?.status])

  useEffect(() => {
    if (lightState?.status === 'running' || lightState?.status === 'paused') return

    setLightItemId(current => {
      if (lightItemsForSelectedMember.some(choice => choice.itemId === current)) return current
      return lightItemsForSelectedMember[0]?.itemId ?? ''
    })
  }, [lightItemsForSelectedMember, lightState?.status])

  useEffect(() => {
    if (!lightState || lightState.status === 'off') {
      setLightTransferCharacterId('')
      return
    }

    setLightTransferCharacterId(current => {
      if (
        current &&
        current !== activeLightCarrierKey &&
        expeditionCarrierOptions.some(member => member.key === current)
      ) {
        return current
      }

      return (
        expeditionCarrierOptions.find(member => member.key !== activeLightCarrierKey)
          ?.key ?? ''
      )
    })
  }, [
    expeditionCarrierOptions,
    activeLightCarrierKey,
    lightState?.status,
  ])

  async function handleLightStartOrResume() {
    if (!activeId) return

    try {
      setLightLoading(true)

      if (lightState?.status === 'paused') {
        setLightState(await resumeCampaignLight(activeId))
        setLightNow(Date.now())
        return
      }

      if (!selectedLightChoice) {
        setError('Wybierz członka ekspedycji i źródło światła z jego ekwipunku.')
        return
      }

      setLightState(
        await startCampaignLight(
          activeId,
          selectedLightChoice.memberType,
          selectedLightChoice.itemId
        )
      )
      setLightNow(Date.now())
      await Promise.all([
        refreshItems(),
        refreshCharacters(),
        refreshNpcItems(),
        refreshNpcs(),
      ])
      flash('Źródło światła zostało zapalone.')
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się uruchomić światła.')
    } finally {
      setLightLoading(false)
    }
  }

  async function handleLightPause() {
    if (!activeId || lightState?.status !== 'running') return

    try {
      setLightLoading(true)
      setLightState(await pauseCampaignLight(activeId))
      setLightNow(Date.now())
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zatrzymać licznika.')
    } finally {
      setLightLoading(false)
    }
  }

  async function handleLightExtinguish() {
    if (!activeId) return

    try {
      setLightLoading(true)
      setLightState(await extinguishCampaignLight(activeId))
      setLightNow(Date.now())
      await Promise.all([
        refreshItems(),
        refreshCharacters(),
        refreshNpcItems(),
        refreshNpcs(),
      ])
      flash('Światło zgaszone.')
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zgasić światła.')
    } finally {
      setLightLoading(false)
    }
  }

  async function handleLightTransfer() {
    if (
      !activeId ||
      !lightTransferCharacterId ||
      !lightState ||
      lightState.status === 'off'
    ) {
      return
    }

    const target = expeditionCarrierOptions.find(
      member => member.key === lightTransferCharacterId
    )
    if (!target) return

    try {
      setLightLoading(true)
      const next = await transferCampaignLight(activeId, target.type, target.id)
      setLightState(next)
      setLightNow(Date.now())
      await Promise.all([
        refreshItems(),
        refreshCharacters(),
        refreshNpcItems(),
        refreshNpcs(),
      ])
      flash(`Przekazano światło i przedmiot: ${target.name}.`)
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się przekazać światła.')
    } finally {
      setLightLoading(false)
    }
  }


  type LightInventoryRow = {
    id: string
    catalogItemId: string | null
    name: string
    quantity: number
    category: ItemCategory
    lightMinutes: number | null
  }

  const calculateLightSecondsForOwner = useCallback(
    (
      ownerItems: LightInventoryRow[],
      activeSourceId: string | null,
      activeForOwner: boolean
    ) => {
      let seconds = 0
      const seenReusable = new Set<string>()

      const normalized = (value: string) => normalizeInventoryName(value)

      for (const item of ownerItems) {
        if (item.category !== 'light' || item.quantity <= 0 || !item.lightMinutes) continue

        const rule = catalogEntryForItem(item.catalogItemId)
        const isActiveSource = activeForOwner && activeSourceId === item.id

        if (rule && !rule.lightConsumesSource && rule.lightFuelItemName) {
          const reusableKey = rule.id || normalized(item.name)
          if (seenReusable.has(reusableKey)) {
            if (isActiveSource) seconds += lightRemainingSeconds
            continue
          }
          seenReusable.add(reusableKey)

          const fuelCatalogIds = new Set(
            catalog
              .filter(
                entry =>
                  normalized(entry.name) === normalized(rule.lightFuelItemName ?? '')
              )
              .map(entry => entry.id)
          )

          const fuelQuantity = ownerItems
            .filter(candidate => {
              if (
                candidate.catalogItemId &&
                fuelCatalogIds.has(candidate.catalogItemId)
              ) {
                return true
              }

              return normalized(candidate.name) === normalized(rule.lightFuelItemName ?? '')
            })
            .reduce((sum, candidate) => sum + candidate.quantity, 0)

          const fuelUses = Math.floor(
            fuelQuantity / Math.max(1, rule.lightFuelQuantity || 1)
          )

          seconds += fuelUses * item.lightMinutes * 60
          if (isActiveSource) seconds += lightRemainingSeconds
          continue
        }

        if (isActiveSource) {
          seconds += lightRemainingSeconds
          const unusedQuantity = Math.max(0, item.quantity - 1)
          seconds += unusedQuantity * item.lightMinutes * 60
        } else {
          seconds += item.quantity * item.lightMinutes * 60
        }
      }

      return seconds
    },
    [
      catalog,
      catalogEntryForItem,
      lightRemainingSeconds,
      normalizeInventoryName,
    ]
  )

  const characterLightSeconds = useMemo(
    () =>
      characters.reduce((sum, character) => {
        const ownerItems = itemsForCharacter(character.id)
        const active =
          lightState?.carrierType === 'character' &&
          lightState.characterId === character.id

        return (
          sum +
          calculateLightSecondsForOwner(
            ownerItems,
            active ? lightState?.sourceItemId ?? null : null,
            active
          )
        )
      }, 0),
    [
      characters,
      itemsForCharacter,
      lightState,
      calculateLightSecondsForOwner,
    ]
  )

  const npcLightSeconds = useMemo(
    () =>
      npcs.reduce((sum, npc) => {
        const ownerItems = itemsForNpc(npc.id)
        const active =
          lightState?.carrierType === 'npc' &&
          lightState.npcId === npc.id

        return (
          sum +
          calculateLightSecondsForOwner(
            ownerItems,
            active ? lightState?.sourceNpcItemId ?? null : null,
            active
          )
        )
      }, 0),
    [npcs, itemsForNpc, lightState, calculateLightSecondsForOwner]
  )

  const animalLightSeconds = useMemo(
    () =>
      animals.reduce(
        (sum, animal) =>
          sum +
          calculateLightSecondsForOwner(
            itemsForAnimal(animal.id),
            null,
            false
          ),
        0
      ),
    [animals, itemsForAnimal, calculateLightSecondsForOwner]
  )

  const expeditionLightSeconds =
    characterLightSeconds + npcLightSeconds + animalLightSeconds


  async function createCampaign() {
    const name = newCampaign.trim()

    if (!name) return

    try {
      if (isCloudMode) {
        const campaign =
          await createRemoteCampaign(name)

        setCampaigns(prev => [
          ...prev,
          campaign,
        ])

        setActiveId(campaign.id)
      } else {
        const campaign: Campaign = {
          id: crypto.randomUUID(),
          name,
          createdAt:
            new Date().toISOString(),
          inviteCode: `LOCAL${Math.random()
            .toString(36)
            .slice(2, 8)
            .toUpperCase()}`,
          role: 'owner',
        }

        setCampaigns(prev => [
          ...prev,
          campaign,
        ])

        setActiveId(campaign.id)
      }

      setNewCampaign('')
      setShowCreate(false)

      flash(
        'Kampania została utworzona.'
      )
    } catch (e: any) {
      console.error('CREATE CAMPAIGN ERROR:', e)
      setError(
        e?.message ||
        e?.details ||
        e?.hint ||
        JSON.stringify(e)
      )
    }
  }

  async function handleJoin() {
    if (!isCloudMode) {
      setError(
        'Dołączanie do wspólnej kampanii wymaga aktywnego połączenia z Supabase.'
      )
      return
    }

    const code = joinCode
      .trim()
      .toUpperCase()

    if (!code) return

    try {
      await joinCampaign(code)

      await refreshCampaigns()

      setJoinCode('')
      setShowJoin(false)

      flash(
        'Dołączono do kampanii.'
      )
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Nie udało się dołączyć do kampanii.'
      )
    }
  }

  async function copyInviteCode() {
    if (!active?.inviteCode) return

    await navigator.clipboard.writeText(
      active.inviteCode
    )

    flash(
      'Kod kampanii skopiowany.'
    )
  }

  function flash(text: string) {
    setMessage(text)

    window.setTimeout(
      () => setMessage(null),
      3000
    )
  }

  function openNewCharacter() {
    setEditingCharacter(null)
    setCharacterName('')
    setCharacterStrength(10)
    setCharacterGold(0)
    setShowCharacter(true)
  }

  function openEditCharacter(character: Character) {
    setEditingCharacter(character)
    setCharacterName(character.name)
    setCharacterStrength(character.strength)
    setCharacterGold(character.gold)
    setShowCharacter(true)
  }

  async function saveCharacter() {
    if (!activeId) {
      setError('Najpierw wybierz kampanię.')
      return
    }

    if (!characterName.trim()) {
      setError('Postać musi mieć nazwę.')
      return
    }

    try {
      if (editingCharacter) {
        await updateCharacter(editingCharacter.id, {
          name: characterName,
          strength: characterStrength,
          gold: characterGold,
          usedSlots: usedSlotsForCharacter(editingCharacter.id),
        })
        flash('Postać została zaktualizowana.')
      } else {
        await createCharacter(activeId, characterName, characterStrength, characterGold)
        flash('Postać została dodana.')
      }

      setShowCharacter(false)
      setEditingCharacter(null)
      await refreshCharacters()
    } catch (e: any) {
      console.error('SAVE CHARACTER ERROR:', e)
      setError(e?.message || e?.details || 'Nie udało się zapisać postaci.')
    }
  }

  async function removeCharacter(character: Character) {
    const confirmed = window.confirm(
      `Czy na pewno usunąć postać "${character.name}"?`
    )

    if (!confirmed) return

    try {
      await deleteCharacter(character.id)
      flash('Postać została usunięta.')
      await refreshCharacters()
    } catch (e: any) {
      console.error('DELETE CHARACTER ERROR:', e)
      setError(e?.message || e?.details || 'Nie udało się usunąć postaci.')
    }
  }

  function resetItemDetails() {
    setItemCatalogItemId('')
    setItemName('')
    setItemQuantity(1)
    setItemSlotsPerUnit(1)
    setItemSlotGroupSize(1)
    setItemFreeQuantity(0)
    setItemCategory('normal')
    setItemLightMinutes(60)
    setItemWeaponDamage('')
    setItemWeaponRange('')
    setItemWeaponProperties('')
    setItemArmorClass('')
    setItemArmorProperties('')
  }

  function applyCatalogItem(entry: CatalogItem) {
    setItemCatalogItemId(entry.id)
    setItemName(entry.name)
    setItemSlotsPerUnit(entry.slotsPerUnit)
    setItemSlotGroupSize(entry.slotGroupSize)
    setItemFreeQuantity(entry.freeQuantity)
    setItemCategory(entry.category)
    setItemLightMinutes(entry.lightMinutes ?? 60)
    setItemWeaponDamage(entry.weaponDamage ?? '')
    setItemWeaponRange(entry.weaponRange ?? '')
    setItemWeaponProperties(entry.weaponProperties ?? '')
    setItemArmorClass(entry.armorClass ?? '')
    setItemArmorProperties(entry.armorProperties ?? '')
  }

  function openNewItem(characterId: string) {
    setEditingItem(null)
    setItemCharacterId(characterId)
    resetItemDetails()
    setShowItem(true)
  }

  function openEditItem(item: CharacterItem) {
    setEditingItem(item)
    setItemCharacterId(item.characterId)
    setItemCatalogItemId(item.catalogItemId ?? '')
    setItemName(item.name)
    setItemQuantity(item.quantity)
    setItemSlotsPerUnit(item.slotsPerUnit)
    setItemSlotGroupSize(item.slotGroupSize)
    setItemFreeQuantity(item.freeQuantity)
    setItemCategory(item.category)
    setItemLightMinutes(item.lightMinutes ?? 60)
    setItemWeaponDamage(item.weaponDamage ?? '')
    setItemWeaponRange(item.weaponRange ?? '')
    setItemWeaponProperties(item.weaponProperties ?? '')
    setItemArmorClass(item.armorClass ?? '')
    setItemArmorProperties(item.armorProperties ?? '')
    setShowItem(true)
  }

  function openNewCatalogItem() {
    setCatalogName('')
    setCatalogSlotsPerUnit(1)
    setCatalogSlotGroupSize(1)
    setCatalogFreeQuantity(0)
    setCatalogCategory('normal')
    setCatalogLightMinutes(60)
    setCatalogWeaponDamage('')
    setCatalogWeaponRange('')
    setCatalogWeaponProperties('')
    setCatalogArmorClass('')
    setCatalogArmorProperties('')
    setCatalogIsMagical(false)
    setCatalogMagicDescription('')
    setShowCatalogItem(true)
  }

  async function saveCatalogItem() {
    if (!activeId || !catalogName.trim()) return

    try {
      const created = await createCatalogItem({
        campaignId: activeId,
        name: catalogName,
        slotsPerUnit: catalogSlotsPerUnit,
        slotGroupSize: catalogSlotGroupSize,
        freeQuantity: catalogFreeQuantity,
        category: catalogCategory,
        lightMinutes: catalogCategory === 'light' ? catalogLightMinutes : null,
        weaponDamage: catalogCategory === 'weapon' ? catalogWeaponDamage : null,
        weaponRange: catalogCategory === 'weapon' ? catalogWeaponRange : null,
        weaponProperties: catalogCategory === 'weapon' ? catalogWeaponProperties : null,
        armorClass: catalogCategory === 'armor' ? catalogArmorClass : null,
        armorProperties: catalogCategory === 'armor' ? catalogArmorProperties : null,
        isMagical: catalogIsMagical,
        magicDescription: catalogIsMagical ? catalogMagicDescription : null,
      })
      setCatalog(prev => [...prev.filter(i => i.id !== created.id), created].sort((a, b) => a.name.localeCompare(b.name, 'pl')))
      applyCatalogItem(created)
      setShowCatalogItem(false)
      flash(`Dodano "${created.name}" do katalogu kampanii.`)
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się dodać przedmiotu do katalogu.')
    }
  }

  async function saveItem() {
    if (!activeId || !itemCharacterId) {
      setError('Najpierw wybierz kampanię i postać.')
      return
    }
    if (!itemName.trim()) {
      setError('Wybierz przedmiot z katalogu.')
      return
    }

    const details = {
      catalogItemId: itemCatalogItemId || null,
      name: itemName,
      quantity: itemQuantity,
      slotsPerUnit: itemSlotsPerUnit,
      slotGroupSize: itemSlotGroupSize,
      freeQuantity: itemFreeQuantity,
      category: itemCategory,
      lightMinutes: itemCategory === 'light' ? itemLightMinutes : null,
      weaponDamage: itemCategory === 'weapon' ? itemWeaponDamage : null,
      weaponRange: itemCategory === 'weapon' ? itemWeaponRange : null,
      weaponProperties: itemCategory === 'weapon' ? itemWeaponProperties : null,
      armorClass: itemCategory === 'armor' ? itemArmorClass : null,
      armorProperties: itemCategory === 'armor' ? itemArmorProperties : null,
    }

    try {
      if (editingItem) {
        await updateItem(editingItem.id, itemCharacterId, details)
        flash('Przedmiot został zaktualizowany.')
      } else {
        await createItem({
          campaignId: activeId,
          characterId: itemCharacterId,
          ...details,
        })
        flash('Przedmiot został dodany.')
      }
      setShowItem(false)
      setEditingItem(null)
      await Promise.all([refreshItems(), refreshCharacters()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zapisać przedmiotu.')
    }
  }

  async function removeItem(item: CharacterItem) {
    if (!window.confirm(`Czy na pewno usunąć "${item.name}" z ekwipunku?`)) return
    try {
      await deleteItem(item.id, item.characterId)
      flash('Przedmiot został usunięty.')
      await Promise.all([refreshItems(), refreshCharacters()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się usunąć przedmiotu.')
    }
  }

  async function consumeOne(item: CharacterItem) {
    try {
      if (item.quantity <= 1) {
        await deleteItem(item.id, item.characterId)
      } else {
        await updateItem(item.id, item.characterId, {
          catalogItemId: item.catalogItemId,
          name: item.name,
          quantity: item.quantity - 1,
          slotsPerUnit: item.slotsPerUnit,
          slotGroupSize: item.slotGroupSize,
          freeQuantity: item.freeQuantity,
          category: item.category,
          lightMinutes: item.lightMinutes,
          weaponDamage: item.weaponDamage,
          weaponRange: item.weaponRange,
          weaponProperties: item.weaponProperties,
          armorClass: item.armorClass,
          armorProperties: item.armorProperties,
        })
      }
      flash(`Zużyto 1 × ${item.name}.`)
      await Promise.all([refreshItems(), refreshCharacters()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zużyć przedmiotu.')
    }
  }


  function openNewAnimal() {
    setEditingAnimal(null)
    setAnimalName('')
    setAnimalType('')
    setAnimalBaseSlots(10)
    setAnimalPersonality('')
    setSelectedMountCatalogName('')
    setShowAnimal(true)
  }

  function applyMountCatalogEntry(entry: MountCatalogEntry) {
    setSelectedMountCatalogName(entry.name)
    setAnimalType(entry.name)
    setAnimalBaseSlots(entry.gearSlots)
  }


  function openEditAnimal(animal: Animal) {
    setEditingAnimal(animal)
    setAnimalName(animal.name)
    setAnimalType(animal.animalType)
    setAnimalBaseSlots(animal.baseSlots)
    setAnimalPersonality(animal.personality ?? '')
    setSelectedMountCatalogName('')
    setShowAnimal(true)
  }

  async function saveAnimal() {
    if (!activeId || !animalName.trim()) {
      setError('Zwierzę musi mieć nazwę.')
      return
    }

    try {
      if (editingAnimal) {
        await updateAnimal(editingAnimal.id, {
          name: animalName,
          animalType,
          baseSlots: animalBaseSlots,
          personality: animalPersonality,
        })
        flash('Zwierzę zostało zaktualizowane.')
      } else {
        await createAnimal(activeId, animalName, animalType, animalBaseSlots, animalPersonality)
        flash('Zwierzę zostało dodane.')
      }

      setShowAnimal(false)
      setEditingAnimal(null)
      await refreshAnimals()
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zapisać zwierzęcia.')
    }
  }

  async function removeAnimal(animal: Animal) {
    if (!window.confirm(`Czy na pewno usunąć zwierzę "${animal.name}" wraz z jego ekwipunkiem?`)) return

    try {
      await deleteAnimal(animal.id)
      flash('Zwierzę zostało usunięte.')
      await Promise.all([refreshAnimals(), refreshAnimalItems()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się usunąć zwierzęcia.')
    }
  }

  function resetAnimalItemDetails() {
    setAnimalItemCatalogItemId('')
    setAnimalItemName('')
    setAnimalItemQuantity(1)
    setAnimalItemSlotsPerUnit(1)
    setAnimalItemSlotGroupSize(1)
    setAnimalItemFreeQuantity(0)
    setAnimalItemCategory('normal')
    setAnimalItemLightMinutes(60)
    setAnimalItemWeaponDamage('')
    setAnimalItemWeaponRange('')
    setAnimalItemWeaponProperties('')
    setAnimalItemArmorClass('')
    setAnimalItemArmorProperties('')
  }

  function applyCatalogToAnimalItem(entry: CatalogItem) {
    setAnimalItemCatalogItemId(entry.id)
    setAnimalItemName(entry.name)
    setAnimalItemQuantity(isWagonName(entry.name) ? 1 : 1)
    setAnimalItemSlotsPerUnit(entry.slotsPerUnit)
    setAnimalItemSlotGroupSize(entry.slotGroupSize)
    setAnimalItemFreeQuantity(entry.freeQuantity)
    setAnimalItemCategory(entry.category)
    setAnimalItemLightMinutes(entry.lightMinutes ?? 60)
    setAnimalItemWeaponDamage(entry.weaponDamage ?? '')
    setAnimalItemWeaponRange(entry.weaponRange ?? '')
    setAnimalItemWeaponProperties(entry.weaponProperties ?? '')
    setAnimalItemArmorClass(entry.armorClass ?? '')
    setAnimalItemArmorProperties(entry.armorProperties ?? '')
  }

  function openNewAnimalItem(animalId: string) {
    setEditingAnimalItem(null)
    setAnimalItemAnimalId(animalId)
    resetAnimalItemDetails()
    setShowAnimalItem(true)
  }

  function openEditAnimalItem(item: AnimalItem) {
    setEditingAnimalItem(item)
    setAnimalItemAnimalId(item.animalId)
    setAnimalItemCatalogItemId(item.catalogItemId ?? '')
    setAnimalItemName(item.name)
    setAnimalItemQuantity(item.quantity)
    setAnimalItemSlotsPerUnit(item.slotsPerUnit)
    setAnimalItemSlotGroupSize(item.slotGroupSize)
    setAnimalItemFreeQuantity(item.freeQuantity)
    setAnimalItemCategory(item.category)
    setAnimalItemLightMinutes(item.lightMinutes ?? 60)
    setAnimalItemWeaponDamage(item.weaponDamage ?? '')
    setAnimalItemWeaponRange(item.weaponRange ?? '')
    setAnimalItemWeaponProperties(item.weaponProperties ?? '')
    setAnimalItemArmorClass(item.armorClass ?? '')
    setAnimalItemArmorProperties(item.armorProperties ?? '')
    setShowAnimalItem(true)
  }

  async function saveAnimalItem() {
    if (!activeId || !animalItemAnimalId || !animalItemName.trim()) {
      setError('Wybierz zwierzę i przedmiot.')
      return
    }

    if (isWagonName(animalItemName) && animalHasWagon(animalItemAnimalId) && !editingAnimalItem) {
      setError('To zwierzę ma już wóz. Jedno zwierzę może mieć tylko jeden wóz.')
      return
    }

    try {
      if (editingAnimalItem) {
        await updateAnimalItem(editingAnimalItem.id, {
          name: animalItemName,
          quantity: isWagonName(animalItemName) ? 1 : animalItemQuantity,
        })
        flash('Ekwipunek zwierzęcia został zaktualizowany.')
      } else {
        await createAnimalItem({
          campaignId: activeId,
          animalId: animalItemAnimalId,
          catalogItemId: animalItemCatalogItemId || null,
          name: animalItemName,
          quantity: isWagonName(animalItemName) ? 1 : animalItemQuantity,
          slotsPerUnit: animalItemSlotsPerUnit,
          slotGroupSize: animalItemSlotGroupSize,
          freeQuantity: animalItemFreeQuantity,
          category: animalItemCategory,
          lightMinutes: animalItemCategory === 'light' ? animalItemLightMinutes : null,
          weaponDamage: animalItemCategory === 'weapon' ? animalItemWeaponDamage : null,
          weaponRange: animalItemCategory === 'weapon' ? animalItemWeaponRange : null,
          weaponProperties: animalItemCategory === 'weapon' ? animalItemWeaponProperties : null,
          armorClass: animalItemCategory === 'armor' ? animalItemArmorClass : null,
          armorProperties: animalItemCategory === 'armor' ? animalItemArmorProperties : null,
        })
        flash(
          isWagonName(animalItemName)
            ? 'Wóz został przypisany do zwierzęcia. Udźwig wzrósł o 15 slotów.'
            : 'Przedmiot został dodany zwierzęciu.'
        )
      }

      setShowAnimalItem(false)
      setEditingAnimalItem(null)
      await Promise.all([refreshAnimalItems(), refreshAnimals()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zapisać ekwipunku zwierzęcia.')
    }
  }

  async function removeAnimalItem(item: AnimalItem) {
    const label = isWagonName(item.name) ? 'wóz' : `"${item.name}"`
    if (!window.confirm(`Usunąć ${label} z wyposażenia zwierzęcia?`)) return

    try {
      await deleteAnimalItem(item.id)
      flash(isWagonName(item.name) ? 'Wóz został odpięty od zwierzęcia.' : 'Przedmiot został usunięty.')
      await Promise.all([refreshAnimalItems(), refreshAnimals()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się usunąć przedmiotu.')
    }
  }

  function openNewNpc() {
    setEditingNpc(null)
    setNpcName('')
    setNpcRole('')
    setNpcMaxSlots(10)
    setShowNpc(true)
  }

  function openEditNpc(npc: Npc) {
    setEditingNpc(npc)
    setNpcName(npc.name)
    setNpcRole(npc.role)
    setNpcMaxSlots(npc.maxSlots)
    setShowNpc(true)
  }

  async function saveNpc() {
    if (!activeId || !npcName.trim()) {
      setError('NPC musi mieć nazwę.')
      return
    }

    try {
      if (editingNpc) {
        await updateNpc(editingNpc.id, {
          name: npcName,
          role: npcRole,
          maxSlots: npcMaxSlots,
        })
        flash('NPC został zaktualizowany.')
      } else {
        await createNpc(activeId, npcName, npcRole, npcMaxSlots)
        flash('NPC został dodany.')
      }

      setShowNpc(false)
      setEditingNpc(null)
      await refreshNpcs()
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zapisać NPC.')
    }
  }

  async function removeNpc(npc: Npc) {
    if (!window.confirm(`Czy na pewno usunąć NPC "${npc.name}" wraz z jego ekwipunkiem?`)) return

    try {
      await deleteNpc(npc.id)
      flash('NPC został usunięty.')
      await Promise.all([refreshNpcs(), refreshNpcItems()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się usunąć NPC.')
    }
  }

  function resetNpcItemDetails() {
    setNpcItemCatalogItemId('')
    setNpcItemName('')
    setNpcItemQuantity(1)
    setNpcItemSlotsPerUnit(1)
    setNpcItemSlotGroupSize(1)
    setNpcItemFreeQuantity(0)
    setNpcItemCategory('normal')
    setNpcItemLightMinutes(60)
    setNpcItemWeaponDamage('')
    setNpcItemWeaponRange('')
    setNpcItemWeaponProperties('')
    setNpcItemArmorClass('')
    setNpcItemArmorProperties('')
  }

  function applyCatalogToNpcItem(entry: CatalogItem) {
    setNpcItemCatalogItemId(entry.id)
    setNpcItemName(entry.name)
    setNpcItemSlotsPerUnit(entry.slotsPerUnit)
    setNpcItemSlotGroupSize(entry.slotGroupSize)
    setNpcItemFreeQuantity(entry.freeQuantity)
    setNpcItemCategory(entry.category)
    setNpcItemLightMinutes(entry.lightMinutes ?? 60)
    setNpcItemWeaponDamage(entry.weaponDamage ?? '')
    setNpcItemWeaponRange(entry.weaponRange ?? '')
    setNpcItemWeaponProperties(entry.weaponProperties ?? '')
    setNpcItemArmorClass(entry.armorClass ?? '')
    setNpcItemArmorProperties(entry.armorProperties ?? '')
  }

  function openNewNpcItem(npcId: string) {
    setEditingNpcItem(null)
    setNpcItemNpcId(npcId)
    resetNpcItemDetails()
    setShowNpcItem(true)
  }

  function openEditNpcItem(item: NpcItem) {
    setEditingNpcItem(item)
    setNpcItemNpcId(item.npcId)
    setNpcItemCatalogItemId(item.catalogItemId ?? '')
    setNpcItemName(item.name)
    setNpcItemQuantity(item.quantity)
    setNpcItemSlotsPerUnit(item.slotsPerUnit)
    setNpcItemSlotGroupSize(item.slotGroupSize)
    setNpcItemFreeQuantity(item.freeQuantity)
    setNpcItemCategory(item.category)
    setNpcItemLightMinutes(item.lightMinutes ?? 60)
    setNpcItemWeaponDamage(item.weaponDamage ?? '')
    setNpcItemWeaponRange(item.weaponRange ?? '')
    setNpcItemWeaponProperties(item.weaponProperties ?? '')
    setNpcItemArmorClass(item.armorClass ?? '')
    setNpcItemArmorProperties(item.armorProperties ?? '')
    setShowNpcItem(true)
  }

  async function saveNpcItem() {
    if (!activeId || !npcItemNpcId || !npcItemName.trim()) {
      setError('Wybierz NPC i przedmiot.')
      return
    }

    const details = {
      catalogItemId: npcItemCatalogItemId || null,
      name: npcItemName,
      quantity: npcItemQuantity,
      slotsPerUnit: npcItemSlotsPerUnit,
      slotGroupSize: npcItemSlotGroupSize,
      freeQuantity: npcItemFreeQuantity,
      category: npcItemCategory,
      lightMinutes: npcItemCategory === 'light' ? npcItemLightMinutes : null,
      weaponDamage: npcItemCategory === 'weapon' ? npcItemWeaponDamage : null,
      weaponRange: npcItemCategory === 'weapon' ? npcItemWeaponRange : null,
      weaponProperties: npcItemCategory === 'weapon' ? npcItemWeaponProperties : null,
      armorClass: npcItemCategory === 'armor' ? npcItemArmorClass : null,
      armorProperties: npcItemCategory === 'armor' ? npcItemArmorProperties : null,
    }

    try {
      if (editingNpcItem) {
        await updateNpcItem(editingNpcItem.id, npcItemNpcId, details)
        flash('Przedmiot NPC został zaktualizowany.')
      } else {
        await createNpcItem({
          campaignId: activeId,
          npcId: npcItemNpcId,
          ...details,
        })
        flash('Przedmiot został dodany NPC.')
      }

      setShowNpcItem(false)
      setEditingNpcItem(null)
      await Promise.all([refreshNpcItems(), refreshNpcs()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zapisać przedmiotu NPC.')
    }
  }

  async function removeNpcItem(item: NpcItem) {
    if (!window.confirm(`Usunąć "${item.name}" z ekwipunku NPC?`)) return

    try {
      await deleteNpcItem(item.id, item.npcId)
      flash('Przedmiot NPC został usunięty.')
      await Promise.all([refreshNpcItems(), refreshNpcs()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się usunąć przedmiotu NPC.')
    }
  }

  function catalogCategoryLabel(category: CatalogItemCategory) {
    switch (category) {
      case 'food': return 'Żywność'
      case 'light': return 'Światło'
      case 'weapon': return 'Broń'
      case 'armor': return 'Pancerz'
      default: return 'Przedmiot'
    }
  }

  function catalogItemDetails(entry: CatalogItem) {
    const parts = [entry.slotGroupSize > 1 ? `${entry.slotsPerUnit} slot / ${entry.slotGroupSize} szt.` : `${entry.slotsPerUnit} slot./szt.`]
    if (entry.freeQuantity > 0) parts.push(`pierwsze ${entry.freeQuantity} bez slotu`)
    if (entry.category === 'light' && entry.lightMinutes) parts.push(`${entry.lightMinutes} min światła`)
    if (entry.category === 'weapon') {
      if (entry.weaponDamage) parts.push(`obrażenia ${entry.weaponDamage}`)
      if (entry.weaponRange) parts.push(`zasięg ${entry.weaponRange}`)
      if (entry.weaponProperties) parts.push(entry.weaponProperties)
    }
    if (entry.category === 'armor') {
      if (entry.armorClass) parts.push(`KP/AC ${entry.armorClass}`)
      if (entry.armorProperties) parts.push(entry.armorProperties)
    }
    if (entry.isMagical) parts.push('MAGICZNY')
    if (entry.isMagical && entry.magicDescription) parts.push(entry.magicDescription)
    return parts.join(' • ')
  }

  async function addStarterCatalog() {
    if (!activeId) return
    const existing = new Set(catalog.map(item => item.name.trim().toLowerCase()))
    const starter: Array<{
      name: string
      slotsPerUnit: number
      category: CatalogItemCategory
      lightMinutes?: number | null
    }> = [
      { name: 'Pochodnia', slotsPerUnit: 1, category: 'light', lightMinutes: 60 },
      { name: 'Racje', slotsPerUnit: 0.33, category: 'food', lightMinutes: null },
    ]

    try {
      for (const item of starter) {
        if (existing.has(item.name.toLowerCase())) continue
        await createCatalogItem({ campaignId: activeId, ...item })
      }
      await refreshCatalog()
      flash('Dodano bazowe pozycje do biblioteki.')
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się dodać bazowej biblioteki.')
    }
  }

  async function removeCatalogEntry(entry: CatalogItem) {
    if (!window.confirm(`Usunąć "${entry.name}" z biblioteki kampanii? Przedmioty już w ekwipunku pozostaną.`)) return
    try {
      await deleteCatalogItem(entry.id)
      await refreshCatalog()
      flash('Usunięto pozycję z biblioteki.')
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się usunąć pozycji.')
    }
  }

  function parseCatalogCsv(text: string) {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    if (!lines.length) return []
    const start = lines[0].toLowerCase().startsWith('name;') ? 1 : 0

    return lines.slice(start).map((line, index) => {
      const cols = line.split(';').map(value => value.trim())
      const [name, categoryRaw = 'normal', slotsRaw = '1', lightRaw = '',
        weaponDamage = '', weaponRange = '', weaponProperties = '',
        armorClass = '', armorProperties = '', slotGroupRaw = '1',
        freeQuantityRaw = '0', magicalRaw = 'false', magicDescription = ''] = cols

      if (!name) throw new Error(`Brak nazwy przedmiotu w wierszu ${index + 1 + start}.`)

      const allowed: CatalogItemCategory[] = ['normal', 'food', 'light', 'weapon', 'armor']
      const category = allowed.includes(categoryRaw as CatalogItemCategory)
        ? (categoryRaw as CatalogItemCategory) : 'normal'

      const slotsPerUnit = Number(slotsRaw.replace(',', '.'))
      if (!Number.isFinite(slotsPerUnit) || slotsPerUnit < 0) {
        throw new Error(`Nieprawidłowa liczba slotów dla "${name}".`)
      }

      const slotGroupSize = Math.max(1, Number(slotGroupRaw.replace(',', '.')) || 1)
      const freeQuantity = Math.max(0, Number(freeQuantityRaw.replace(',', '.')) || 0)

      const lightParsed = lightRaw === '' ? null : Number(lightRaw.replace(',', '.'))
      const isMagical = ['1', 'true', 'tak', 'yes'].includes(magicalRaw.toLowerCase())

      return {
        name, category, slotsPerUnit, slotGroupSize, freeQuantity, isMagical,
        magicDescription: isMagical ? magicDescription || null : null,
        lightMinutes: category === 'light' && lightParsed != null && Number.isFinite(lightParsed) ? lightParsed : null,
        weaponDamage: category === 'weapon' ? weaponDamage || null : null,
        weaponRange: category === 'weapon' ? weaponRange || null : null,
        weaponProperties: category === 'weapon' ? weaponProperties || null : null,
        armorClass: category === 'armor' ? armorClass || null : null,
        armorProperties: category === 'armor' ? armorProperties || null : null,
      }
    })
  }

  async function importCatalogCsv() {
    if (!activeId) return
    try {
      const rows = parseCatalogCsv(catalogImportText)
      const existing = new Set(catalog.map(item => item.name.trim().toLowerCase()))
      let added = 0
      let skipped = 0

      for (const row of rows) {
        if (existing.has(row.name.trim().toLowerCase())) {
          skipped += 1
          continue
        }
        await createCatalogItem({ campaignId: activeId, ...row })
        existing.add(row.name.trim().toLowerCase())
        added += 1
      }

      await refreshCatalog()
      setShowCatalogImport(false)
      setCatalogImportText('')
      flash(`Import zakończony: dodano ${added}, pominięto ${skipped}.`)
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zaimportować biblioteki.')
    }
  }

  function exportCatalogCsv() {
    const header = 'name;category;slots;light_minutes;weapon_damage;weapon_range;weapon_properties;armor_class;armor_properties;slot_group_size;free_quantity;magical;magic_description'
    const rows = catalog.map(entry =>
      [entry.name, entry.category, entry.slotsPerUnit, entry.lightMinutes ?? '',
       entry.weaponDamage ?? '', entry.weaponRange ?? '', entry.weaponProperties ?? '',
       entry.armorClass ?? '', entry.armorProperties ?? '', entry.slotGroupSize, entry.freeQuantity,
       entry.isMagical ? 'true' : 'false', entry.magicDescription ?? '']
        .map(value => String(value).split(';').join(',')).join(';')
    )

    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `shadowdark-biblioteka-${active?.name ?? 'kampania'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-shell">
      <header className="topbar">

        <button
          className="icon-button mobile-only"
          onClick={() =>
            setMobileNav(v => !v)
          }
          aria-label="Menu"
        >
          <Menu size={20} />
        </button>

        <div className="brand-mark">
          SD
        </div>

        <div className="brand-text">
          <strong>
            Shadowdark Manager
          </strong>

          <span>
            menadżer drużyny i ekwipunku
          </span>
        </div>

        <div className="topbar-actions">

          <div className="sync-badge">

            <span
              className={
                isCloudMode
                  ? 'dot online'
                  : 'dot demo'
              }
            />

            {authLoading
              ? 'Łączenie z Supabase…'
              : isCloudMode
              ? 'Supabase • zsynchronizowano'
              : 'Tryb lokalny'}

          </div>

        </div>
      </header>

      <div className="body-grid">

        <aside
          className={`sidebar ${
            mobileNav ? 'open' : ''
          }`}
        >

          <div className="campaign-label">
            KAMPANIA
          </div>

          <select
            value={active?.id ?? ''}
            onChange={e =>
              setActiveId(e.target.value)
            }
            disabled={
              campaignsLoading ||
              campaigns.length === 0
            }
          >

            {campaigns.length === 0 && (
              <option value="">
                Brak kampanii
              </option>
            )}

            {campaigns.map(c => (
              <option
                key={c.id}
                value={c.id}
              >
                {c.name}
              </option>
            ))}

          </select>

          <button
            className="secondary full"
            onClick={() =>
              setShowCreate(true)
            }
          >
            <Plus size={16} />
            Nowa kampania
          </button>

          <button
            className="secondary full"
            onClick={() =>
              setShowJoin(true)
            }
          >
            <UserPlus size={16} />
            Dołącz kodem
          </button>

          <nav>
            {nav.map(([label, Icon]) => (
              <button
                key={label}
                className={activeView === label ? 'nav-active' : ''}
                onClick={() => {
                  setActiveView(label)
                  setMobileNav(false)
                }}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <Home size={16} />

            <span>
              Etap 3E • zapas światła i karmienie zwierząt</span>
          </div>

        </aside>

        <main>

          {error && (
            <div className="alert error">

              <span>{error}</span>

              <button
                onClick={() =>
                  setError(null)
                }
              >
                <X size={16} />
              </button>

            </div>
          )}

          {message && (
            <div className="alert success">
              {message}
            </div>
          )}

          {!supabaseEnabled && (
            <div className="setup-banner">

              <KeyRound size={18} />

              <div>
                <strong>
                  Tryb lokalny
                </strong>

                <span>
                  Supabase nie jest skonfigurowany.
                  Kampanie są zapisywane tylko
                  w tej przeglądarce.
                </span>
              </div>

            </div>
          )}

          {supabaseEnabled &&
            authLoading && (
              <div className="setup-banner">

                <KeyRound size={18} />

                <div>
                  <strong>
                    Łączenie z Supabase
                  </strong>

                  <span>
                    Tworzenie anonimowej sesji…
                  </span>
                </div>

              </div>
            )}

          {activeView === 'Dashboard' && (
            <>
          <section className="hero parchment-panel">

            <div>

              <p className="eyebrow">
                AKTYWNA KAMPANIA
              </p>

              <h1>
                {active?.name ??
                  'Utwórz pierwszą kampanię'}
              </h1>

              <p>
                Centrum zarządzania drużyną,
                zapasami i wyprawą.
              </p>

            </div>

            <div className="hero-tools">

              {active?.inviteCode && (
                <div className="invite-box">

                  <span>
                    KOD DOŁĄCZENIA
                  </span>

                  <strong>
                    {active.inviteCode}
                  </strong>

                  <button
                    onClick={
                      copyInviteCode
                    }
                    title="Kopiuj kod"
                  >
                    <Copy size={15} />
                  </button>

                </div>
              )}

              <div className="crest">
                <Building2 size={28} />
              </div>

            </div>

          </section>

          <section className="metric-grid">

            <Metric
              icon={<Users />}
              label="Postacie"
              value={String(characters.length)}
              sub="aktywne"
            />

            <Metric
              icon={<Backpack />}
              label="Sloty postaci"
              value={`${Number(characterSlots.used.toFixed(2))} / ${characterSlots.max}`}
              sub={`${Number(Math.max(0, characterSlots.max - characterSlots.used).toFixed(2))} wolnych`}
            />


            <Metric
              icon={<Package />}
              label="Sloty ekspedycji"
              value={`${Number(expeditionSlots.used.toFixed(2))} / ${Number(expeditionSlots.max.toFixed(2))}`}
              sub={`${Number(Math.max(0, expeditionSlots.max - expeditionSlots.used).toFixed(2))} wolnych • postacie + NPC + zwierzęta + wozy`}
            />

            <Metric
              icon={<Flame />}
              label="Światło postaci"
              value={formatTimer(characterLightSeconds)}
              sub="łączny czas źródeł światła wszystkich postaci"
              accent
            />

            <Metric
              icon={<Flame />}
              label="Światło ekspedycji"
              value={formatTimer(expeditionLightSeconds)}
              sub="postacie + NPC + zapasy na zwierzętach"
              accent
            />

            <Metric
              icon={<Coins />}
              label="Majątek"
              value={`${totalGold.toLocaleString(
                'pl-PL'
              )} gp`}
              sub={animalCoins > 0 ? `łącznie • w tym ${animalCoins} gp na zwierzętach` : 'łącznie'}
            />

          </section>

          <section className="dashboard-grid">

            <div className="panel light-panel">

              <div className="panel-title">
                <Flame size={18} />
                Aktywne źródło światła
              </div>

              {lightState?.status === 'running' || lightState?.status === 'paused' ? (
                <>
                  <div className="light-row">
                    <span>Niosący</span>
                    <strong>
                      {lightCarrierName}
                      {lightState.carrierType === 'npc' ? ' (NPC)' : ''}
                    </strong>

                    <span>Źródło</span>
                    <strong>{lightSourceName}</strong>
                  </div>

                  <div className="light-row">
                    <label>
                      Przekaż światło
                      <select
                        value={lightTransferCharacterId}
                        onChange={e => setLightTransferCharacterId(e.target.value)}
                        disabled={lightLoading || expeditionCarrierOptions.length < 2}
                      >
                        {expeditionCarrierOptions.length < 2 && (
                          <option value="">Brak innego członka ekspedycji</option>
                        )}
                        {expeditionCarrierOptions
                          .filter(member => member.key !== activeLightCarrierKey)
                          .map(member => (
                            <option key={member.key} value={member.key}>
                              {member.name}
                              {member.type === 'npc' ? ' (NPC)' : ''}
                            </option>
                          ))}
                      </select>
                    </label>

                    <button
                      className="secondary"
                      onClick={handleLightTransfer}
                      disabled={lightLoading || !lightTransferCharacterId}
                    >
                      PRZEKAŻ
                    </button>
                  </div>
                </>
              ) : (
                <div className="light-row">
                  <label>
                    Niosący
                    <select
                      value={lightCharacterId}
                      onChange={e => setLightCharacterId(e.target.value)}
                      disabled={lightLoading || lightCarrierChoices.length === 0}
                    >
                      {lightCarrierChoices.length === 0 && (
                        <option value="">Brak źródeł światła</option>
                      )}
                      {lightCarrierChoices.map(member => (
                        <option key={member.key} value={member.key}>
                          {member.name}
                          {member.type === 'npc' ? ' (NPC)' : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Źródło
                    <select
                      value={lightItemId}
                      onChange={e => setLightItemId(e.target.value)}
                      disabled={lightLoading || lightItemsForSelectedMember.length === 0}
                    >
                      {lightItemsForSelectedMember.length === 0 && (
                        <option value="">Brak źródła</option>
                      )}
                      {lightItemsForSelectedMember.map(choice => {
                        const fuel = lightFuelStatusForChoice(choice)
                        return (
                          <option key={choice.itemId} value={choice.itemId}>
                            {choice.itemName} × {choice.quantity} • {choice.lightMinutes} min
                            {fuel
                              ? ` • paliwo: ${fuel.name} ${fuel.available}/${fuel.required}${
                                  fuel.available < fuel.required ? ' • BRAK PALIWA' : ''
                                }`
                              : ''}
                          </option>
                        )
                      })}
                    </select>
                  </label>
                </div>
              )}

              <div className="timer">
                {formatTimer(lightRemainingSeconds)}
              </div>

              <div className="button-row">
                <button
                  className="primary"
                  onClick={handleLightStartOrResume}
                  disabled={
                    lightLoading ||
                    lightState?.status === 'running' ||
                    (lightState?.status !== 'paused' &&
                      (!lightItemId || selectedLightMissingFuel))
                  }
                >
                  {lightState?.status === 'paused' ? 'WZNÓW' : 'START'}
                </button>

                <button
                  className="secondary"
                  onClick={handleLightPause}
                  disabled={lightLoading || lightState?.status !== 'running'}
                >
                  PAUZA
                </button>

                <button
                  className="danger"
                  onClick={handleLightExtinguish}
                  disabled={
                    lightLoading ||
                    (!lightState || lightState.status === 'off')
                  }
                >
                  ZGAŚ
                </button>
              </div>

              {lightState?.status !== 'paused' && selectedLightMissingFuel && selectedLightFuel && (
                <div className="alert error">
                  Brak paliwa: potrzebne {selectedLightFuel.required} × {selectedLightFuel.name}.
                </div>
              )}

              <p className="muted">
                START zużywa źródło jednorazowe albo wymagane paliwo. Latarnia
                pozostaje w ekwipunku i przy zapaleniu zużywa 1 × Oil, flask; bez
                paliwa nie można jej zapalić. PRZEKAŻ zmienia niosącego bez
                zatrzymywania ani zerowania licznika. PAUZA i WZNÓW nie zużywają
                kolejnego źródła ani paliwa. Licznik jest wspólny dla wszystkich
                użytkowników kampanii.
              </p>

            </div>

            <div className="panel">

              <div className="panel-title">
                <Beef size={18} />
                Prowiant
              </div>

              <div className="ration-big">
                <strong>{totalRations}</strong>
                <span>
                  racji w ekwipunkach postaci
                </span>
              </div>

              <p>
                <b>{expeditionFeedsAvailable}</b>{' '}
                {expeditionFeedsAvailable === 1
                  ? 'pełne karmienie'
                  : 'pełnych karmień'}{' '}
                całej ekspedycji.
              </p>

              {membersMissingRations.length > 0 ? (
                <div className="setup-banner" style={{ marginBottom: 14 }}>
                  <Beef size={18} />
                  <div>
                    <strong>Brakuje racji</strong>
                    <span>
                      {membersMissingRations
                        .map(member => `${member.name}${member.type === 'npc' ? ' (NPC)' : ''}`)
                        .join(', ')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="setup-banner" style={{ marginBottom: 14 }}>
                  <Beef size={18} />
                  <div>
                    <strong>Racje rozdzielone</strong>
                    <span>Każda postać ma co najmniej 1 własną rację.</span>
                  </div>
                </div>
              )}

              {membersMissingRations.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p className="muted">
                    Przekaż 1 rację od postaci, która ma zapas. Dawcy po
                    przekazaniu musi pozostać co najmniej 1 racja. Pojemność
                    ekwipunku odbiorcy jest sprawdzana przed zatwierdzeniem.
                  </p>

                  {rationDonors.length > 0 ? (
                    <>
                      <label>
                        Dawca
                        <select
                          value={rationTransferFromKey}
                          onChange={e =>
                            setRationTransferFromKey(e.target.value)
                          }
                        >
                          {rationDonors.map(member => (
                            <option key={member.key} value={member.key}>
                              {member.name} ({member.type === 'npc' ? 'NPC' : 'Postać'})
                              {' • '}racje: {member.rationCount}
                              {' • '}sloty: {Number(member.usedSlots.toFixed(2))}/{member.maxSlots}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Odbiorca
                        <select
                          value={rationTransferToKey}
                          onChange={e =>
                            setRationTransferToKey(e.target.value)
                          }
                        >
                          {membersMissingRations.map(member => (
                            <option key={member.key} value={member.key}>
                              {member.name} ({member.type === 'npc' ? 'NPC' : 'Postać'})
                              {' • '}racje: {member.rationCount}
                              {' • '}sloty: {Number(member.usedSlots.toFixed(2))}/{member.maxSlots}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        className="secondary full"
                        onClick={handleTransferRation}
                        disabled={
                          transferringRation ||
                          !rationTransferFromKey ||
                          !rationTransferToKey
                        }
                      >
                        <ArrowRightLeft size={16} />
                        {transferringRation
                          ? 'Przekazywanie…'
                          : 'Przekaż 1 rację'}
                      </button>
                    </>
                  ) : (
                    <div className="setup-banner">
                      <Beef size={18} />
                      <div>
                        <strong>Brak nadmiarowej racji</strong>
                        <span>
                          Żadna postać nie ma więcej niż 1 racji do
                          przekazania.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <p className="muted">
                Nakarmienie ekspedycji zużywa 1 rację wyłącznie z własnego
                ekwipunku każdej postaci.
              </p>

              <button
                className="secondary full"
                onClick={handleFeedExpedition}
                disabled={
                  feedingExpedition ||
                  characters.length === 0 ||
                  membersMissingRations.length > 0
                }
              >
                <Utensils size={16} />
                {feedingExpedition ? 'Karmienie…' : 'Nakarm ekspedycję'}
              </button>


              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: '1px solid rgba(180, 135, 60, 0.28)',
                }}
              >
                <div className="panel-title" style={{ marginBottom: 10 }}>
                  <Beef size={17} />
                  Karmienie zwierząt
                </div>

                {animals.length === 0 ? (
                  <p className="muted">Brak zwierząt w ekspedycji.</p>
                ) : (
                  <>
                    <label>
                      Sposób karmienia
                      <select
                        value={animalFeedMethod}
                        onChange={e =>
                          setAnimalFeedMethod(e.target.value as AnimalFeedMethod)
                        }
                        disabled={feedingAnimals}
                      >
                        <option value="ration">
                          Racje — każde zwierzę zużywa 1 własną rację
                        </option>
                        <option value="pasture">
                          Pastwisko — bez zużywania racji
                        </option>
                      </select>
                    </label>

                    {animalFeedMethod === 'ration' &&
                      animalsMissingRations.length > 0 && (
                        <div className="setup-banner" style={{ marginBottom: 10 }}>
                          <Beef size={17} />
                          <div>
                            <strong>Brakuje racji u zwierząt</strong>
                            <span>
                              {animalsMissingRations
                                .map(animal => animal.name)
                                .join(', ')}
                            </span>
                          </div>
                        </div>
                      )}

                    {animalFeedMethod === 'pasture' && (
                      <p className="muted">
                        Pastwisko karmi wszystkie zwierzęta i nie zużywa żadnych
                        racji z ich ekwipunku.
                      </p>
                    )}

                    <button
                      className="secondary full"
                      onClick={handleFeedAnimals}
                      disabled={
                        feedingAnimals ||
                        (animalFeedMethod === 'ration' &&
                          animalsMissingRations.length > 0)
                      }
                    >
                      <Beef size={16} />
                      {feedingAnimals
                        ? 'Karmienie zwierząt…'
                        : animalFeedMethod === 'pasture'
                          ? 'Nakarm zwierzęta na pastwisku'
                          : 'Nakarm zwierzęta racjami'}
                    </button>
                  </>
                )}
              </div>

            </div>

            <div className="panel wide">

              <div className="panel-title">
                <Users size={18} />
                Postacie

                <button
                  className="secondary"
                  onClick={openNewCharacter}
                  style={{ marginLeft: 'auto' }}
                >
                  <Plus size={16} />
                  Nowa postać
                </button>
              </div>

              {charactersLoading ? (
                <p className="muted">Ładowanie postaci…</p>
              ) : characters.length === 0 ? (
                <div className="empty-state">
                  <p>W tej kampanii nie ma jeszcze żadnych postaci.</p>
                  <button className="primary" onClick={openNewCharacter}>
                    <Plus size={16} />
                    Dodaj pierwszą postać
                  </button>
                </div>
              ) : (
                <div className="entity-grid">
                  {characters.map(character => {
                    const maxSlots = Math.max(10, character.strength)
                    const usedSlots = usedSlotsForCharacter(character.id)
                    const displayedUsedSlots = Number(usedSlots.toFixed(2))

                    return (
                      <article className="entity-card" key={character.id}>
                        <div className="entity-head">
                          <strong>{character.name}</strong>
                          <span>Postać</span>
                        </div>

                        <div className="slot-line">
                          <span>SIŁA {character.strength}</span>
                          <b>{displayedUsedSlots}/{maxSlots}</b>
                        </div>

                        <div className="progress small">
                          <i
                            style={{
                              width: `${Math.min(
                                100,
                                maxSlots > 0
                                  ? (usedSlots / maxSlots) * 100
                                  : 0
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="slot-line" style={{ marginTop: 12 }}>
                          <span>Złoto</span>
                          <b>{character.gold} gp</b>
                        </div>

                        <div className="slot-line" style={{ marginTop: 8 }}>
                          <span>Ostatnio nakarmiona</span>
                          <b>{formatLastFed(character.lastFedAt)}</b>
                        </div>

                        <div className="button-row">
                          <button
                            className="secondary"
                            onClick={() => openEditCharacter(character)}
                          >
                            <Pencil size={15} />
                            Edytuj
                          </button>

                          <button
                            className="danger"
                            onClick={() => removeCharacter(character)}
                          >
                            <Trash2 size={15} />
                            Usuń
                          </button>
                        </div>
                      </article>
                    )
                  })}

                  {npcs.map(npc => {
                    const usedSlots = usedSlotsForNpc(npc.id)

                    return (
                      <article className="entity-card" key={`npc-${npc.id}`}>
                        <div className="entity-head">
                          <strong>{npc.name}</strong>
                          <span>NPC{npc.role ? ` • ${npc.role}` : ''}</span>
                        </div>

                        <div className="slot-line">
                          <span>Pojemność</span>
                          <b>{Number(usedSlots.toFixed(2))}/{npc.maxSlots}</b>
                        </div>

                        <div className="progress small">
                          <i
                            style={{
                              width: `${Math.min(
                                100,
                                npc.maxSlots > 0 ? (usedSlots / npc.maxSlots) * 100 : 0
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="slot-line" style={{ marginTop: 12 }}>
                          <span>Racje</span>
                          <b>{npcRationCounts.get(npc.id) ?? 0}</b>
                        </div>

                        <div className="slot-line" style={{ marginTop: 8 }}>
                          <span>Ostatnio nakarmiony</span>
                          <b>{formatLastFed(npc.lastFedAt)}</b>
                        </div>
                      </article>
                    )
                  })}

                </div>
              )}

            </div>

            <div className="panel wide">

              <div className="panel-title">
                <Coins size={18} />
                Podsumowanie majątku
              </div>

              <div className="wealth-grid">

                <div>
                  <span>
                    Złoto postaci + zwierząt
                  </span>
                  <b>{totalGold.toLocaleString('pl-PL')} gp</b>
                </div>

                <div>
                  <span>
                    Wspólne — ekspedycja
                  </span>
                  <b>600 gp</b>
                </div>

                <div>
                  <span>
                    W siedzibie
                  </span>
                  <b>1 850 gp</b>
                </div>

                <div>
                  <span>
                    Łącznie
                  </span>
                  <b>
                    {(totalGold + 600 + 1850).toLocaleString(
                      'pl-PL'
                    )}{' '}
                    gp
                  </b>
                </div>

              </div>

            </div>

          </section>
            </>
          )}

          {activeView === 'Postacie' && (
            <>
              <section className="hero parchment-panel">
                <div>
                  <p className="eyebrow">POSTACIE</p>
                  <h1>{active?.name ?? 'Brak kampanii'}</h1>
                  <p>
                    Postacie, złoto i ekwipunek aktywnej kampanii.
                    Zmiany synchronizują się między użytkownikami.
                  </p>
                </div>

                <button
                  className="primary"
                  onClick={openNewCharacter}
                  disabled={!activeId}
                >
                  <Plus size={16} />
                  Nowa postać
                </button>
              </section>

              <section className="dashboard-grid">
                <div className="panel wide">
                  <div className="panel-title">
                    <Users size={18} />
                    Postacie i ekwipunek
                  </div>

                  {charactersLoading || itemsLoading ? (
                    <p className="muted">Ładowanie danych…</p>
                  ) : characters.length === 0 ? (
                    <div className="empty-state">
                      <p>W tej kampanii nie ma jeszcze żadnych postaci.</p>
                      <button className="primary" onClick={openNewCharacter}>
                        <Plus size={16} />
                        Dodaj pierwszą postać
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                      {characters.map(character => {
                        const maxSlots = Math.max(10, character.strength)
                        const usedSlots = usedSlotsForCharacter(character.id)
                        const characterItems = itemsForCharacter(character.id)

                        return (
                          <article className="entity-card" key={character.id}>
                            <div className="entity-head">
                              <div>
                                <strong>{character.name}</strong>
                                <span style={{ display: 'block', marginTop: 4 }}>
                                  SIŁA {character.strength} • {character.gold} gp
                                </span>
                                <span style={{ display: 'block', marginTop: 4 }}>
                                  Ostatnio nakarmiona: {formatLastFed(character.lastFedAt)}
                                  {' • '}Racje: {characterRationCounts.get(character.id) ?? 0}
                                </span>
                              </div>

                              <div className="button-row">
                                <button
                                  className="secondary"
                                  onClick={() => openNewItem(character.id)}
                                >
                                  <Package size={15} />
                                  Dodaj przedmiot
                                </button>

                                <button
                                  className="secondary"
                                  onClick={() => openEditCharacter(character)}
                                >
                                  <Pencil size={15} />
                                  Edytuj
                                </button>

                                <button
                                  className="danger"
                                  onClick={() => removeCharacter(character)}
                                >
                                  <Trash2 size={15} />
                                  Usuń
                                </button>
                              </div>
                            </div>

                            <div className="slot-line" style={{ marginTop: 12 }}>
                              <span>Sloty ekwipunku</span>
                              <b>
                                {Number(usedSlots.toFixed(2))}/{maxSlots}
                              </b>
                            </div>

                            <div className="progress small">
                              <i
                                style={{
                                  width: `${Math.min(
                                    100,
                                    maxSlots > 0 ? (usedSlots / maxSlots) * 100 : 0
                                  )}%`,
                                }}
                              />
                            </div>

                            <div style={{ marginTop: 16 }}>
                              {characterItems.length === 0 ? (
                                <p className="muted">
                                  Brak przedmiotów. Dodaj pierwszy element ekwipunku.
                                </p>
                              ) : (
                                <div style={{ display: 'grid', gap: 8 }}>
                                  {characterItems.map(item => (
                                    <div
                                      key={item.id}
                                      className="slot-line"
                                      style={inventoryHighlightStyle(item.category, isMagicalInventoryItem(item.catalogItemId))}
                                    >
                                      <span>
                                        <strong>{item.name}</strong>
                                        {' × '}
                                        {item.quantity}
                                        {' • '}
                                        {item.slotsPerUnit} slot./szt.
                                        {item.category === 'food' && ' • ŻYWNOŚĆ'}
                                        {item.category === 'light' &&
                                          ` • ŚWIATŁO ${item.lightMinutes ?? 60} min`}
                                        {item.category === 'weapon' &&
                                          ` • broń${item.weaponDamage ? ` • obrażenia ${item.weaponDamage}` : ''}${item.weaponRange ? ` • zasięg ${item.weaponRange}` : ''}`}
                                        {item.category === 'armor' &&
                                          ` • pancerz${item.armorClass ? ` • KP/AC ${item.armorClass}` : ''}`}
                                        {isMagicalInventoryItem(item.catalogItemId) && ' • MAGICZNY'}
                                        {isMagicalInventoryItem(item.catalogItemId) &&
                                          magicDescriptionForItem(item.catalogItemId) &&
                                          ` • ${magicDescriptionForItem(item.catalogItemId)}`}
                                        {item.category === 'weapon' && item.weaponProperties &&
                                          ` • ${item.weaponProperties}`}
                                        {item.category === 'armor' && item.armorProperties &&
                                          ` • ${item.armorProperties}`}
                                        {item.isActiveLight && ' • AKTYWNE ŚWIATŁO'}
                                        {isMagicalInventoryItem(item.catalogItemId) && ' • MAGICZNY'}
                                        {isMagicalInventoryItem(item.catalogItemId) &&
                                          magicDescriptionForItem(item.catalogItemId) &&
                                          ` • ${magicDescriptionForItem(item.catalogItemId)}`}
                                      </span>

                                      <span className="button-row">
                                        {(item.category === 'food' ||
                                          item.category === 'light') && (
                                          <button
                                            className="secondary"
                                            onClick={() => consumeOne(item)}
                                          >
                                            <Utensils size={14} />
                                            Zużyj 1
                                          </button>
                                        )}

                                        <button
                                          className="secondary"
                                          onClick={() => openEditItem(item)}
                                        >
                                          <Pencil size={14} />
                                          Edytuj
                                        </button>

                                        <button
                                          className="danger"
                                          onClick={() => removeItem(item)}
                                        >
                                          <Trash2 size={14} />
                                          Usuń
                                        </button>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}


          {activeView === 'Zwierzęta' && (
            <>
              <section className="hero parchment-panel">
                <div>
                  <p className="eyebrow">ZWIERZĘTA TRANSPORTOWE</p>
                  <h1>{active?.name ?? 'Brak kampanii'}</h1>
                  <p>
                    Zwierzęta mają własny udźwig i ekwipunek. Wóz jest specjalnym
                    wyposażeniem zwierzęcia: nie zajmuje jego slotów i zwiększa
                    pojemność o 15 slotów. Jedno zwierzę może ciągnąć tylko jeden wóz.
                  </p>
                </div>

                <button className="primary" onClick={openNewAnimal} disabled={!activeId}>
                  <Plus size={16} />
                  Nowe zwierzę
                </button>
              </section>

              <section className="dashboard-grid">
                <div className="panel wide">
                  <div className="panel-title">
                    <Beef size={18} />
                    Zwierzęta i ładunek
                  </div>

                  {animalsLoading || animalItemsLoading ? (
                    <p className="muted">Ładowanie zwierząt…</p>
                  ) : animals.length === 0 ? (
                    <div className="empty-state">
                      <p>W tej kampanii nie ma jeszcze zwierząt.</p>
                      <button className="primary" onClick={openNewAnimal}>
                        <Plus size={16} />
                        Dodaj pierwsze zwierzę
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                      {animals.map(animal => {
                        const usedSlots = usedSlotsForAnimal(animal.id)
                        const maxSlots = animalMaxSlots(animal)
                        const currentItems = itemsForAnimal(animal.id)
                        const hasWagon = animalHasWagon(animal.id)

                        return (
                          <article className="entity-card" key={animal.id}>
                            <div className="entity-head">
                              <div>
                                <strong>{animal.name}</strong>
                                <span style={{ display: 'block', marginTop: 4 }}>
                                  {animal.animalType || 'Zwierzę transportowe'}
                                </span>
                              </div>

                              <div className="button-row">
                                <button className="secondary" onClick={() => openNewAnimalItem(animal.id)}>
                                  <Package size={15} />
                                  Dodaj wyposażenie
                                </button>
                                <button className="secondary" onClick={() => openEditAnimal(animal)}>
                                  <Pencil size={15} />
                                  Edytuj
                                </button>
                                <button className="danger" onClick={() => removeAnimal(animal)}>
                                  <Trash2 size={15} />
                                  Usuń
                                </button>
                              </div>
                            </div>

                            <div className="slot-line" style={{ marginTop: 12 }}>
                              <span>Udźwig</span>
                              <b>{Number(usedSlots.toFixed(2))}/{maxSlots}</b>
                            </div>

                            <div className="progress small">
                              <i
                                style={{
                                  width: `${Math.min(
                                    100,
                                    maxSlots > 0 ? (usedSlots / maxSlots) * 100 : 0
                                  )}%`,
                                }}
                              />
                            </div>

                            <p className="muted" style={{ marginTop: 8 }}>
                              Bazowy udźwig: {animal.baseSlots}
                              {hasWagon ? ' • Wóz: +15 slotów' : ' • bez wozu'}
                            </p>

                            <div
                              style={{
                                marginTop: 10,
                                padding: '9px 11px',
                                border: '1px solid rgba(180, 135, 60, 0.25)',
                                borderRadius: 8,
                                background: 'rgba(110, 83, 42, 0.08)',
                              }}
                            >
                              <strong style={{ fontSize: 12 }}>PERSONALITY: {personalityLabel(animal.personality)}</strong>
                              {personalityBehavior(animal.personality) && (
                                <span className="muted" style={{ display: 'block', marginTop: 4 }}>
                                  {personalityBehavior(animal.personality)}
                                </span>
                              )}
                            </div>

                            <div className="slot-line" style={{ marginTop: 10 }}>
                              <span>Ostatnio nakarmione</span>
                              <b>{formatLastFed(animal.lastFedAt)}</b>
                            </div>
                            {animal.lastFeedMethod && (
                              <p className="muted" style={{ marginTop: 4 }}>
                                Sposób: {animal.lastFeedMethod === 'pasture' ? 'pastwisko' : 'racja'}
                              </p>
                            )}

                            <div style={{ marginTop: 16 }}>
                              {currentItems.length === 0 ? (
                                <p className="muted">Brak wyposażenia.</p>
                              ) : (
                                <div style={{ display: 'grid', gap: 8 }}>
                                  {currentItems.map(item => {
                                    const wagon = isWagonName(item.name)

                                    return (
                                      <div
                                        key={item.id}
                                        className="slot-line"
                                        style={
                                          wagon
                                            ? {
                                                border: '1px solid rgba(154, 118, 55, 0.85)',
                                                borderRadius: 8,
                                                padding: '12px',
                                                alignItems: 'center',
                                                background:
                                                  'linear-gradient(135deg, rgba(112, 86, 43, 0.28), rgba(61, 72, 48, 0.28))',
                                                boxShadow:
                                                  'inset 0 0 0 1px rgba(224, 190, 112, 0.10)',
                                              }
                                            : inventoryHighlightStyle(item.category, isMagicalInventoryItem(item.catalogItemId))
                                        }
                                      >
                                        <span>
                                          <strong>{item.name}</strong>
                                          {wagon ? (
                                            <>
                                              {' • '}
                                              <b>WÓZ • +15 SLOTÓW UDŹWIGU</b>
                                              {' • specjalne wyposażenie zwierzęcia'}
                                            </>
                                          ) : (
                                            <>
                                              {' × '}{item.quantity}
                                              {' • '}{Number(slotUsageForAnimalItem(item).toFixed(2))} slot.
                                              {item.category === 'food' && ' • ŻYWNOŚĆ'}
                                              {item.category === 'light' && ` • ŚWIATŁO ${item.lightMinutes ?? 60} min`}
                                              {isMagicalInventoryItem(item.catalogItemId) && ' • MAGICZNY'}
                                              {isMagicalInventoryItem(item.catalogItemId) &&
                                                magicDescriptionForItem(item.catalogItemId) &&
                                                ` • ${magicDescriptionForItem(item.catalogItemId)}`}
                                              {isSaddleName(item.name) && ' • pierwsze siodło bez slotu'}
                                            </>
                                          )}
                                        </span>

                                        <span className="button-row">
                                          {!wagon && (
                                            <button className="secondary" onClick={() => openEditAnimalItem(item)}>
                                              <Pencil size={14} />
                                              Edytuj
                                            </button>
                                          )}
                                          <button className="danger" onClick={() => removeAnimalItem(item)}>
                                            <Trash2 size={14} />
                                            {wagon ? 'Odepnij wóz' : 'Usuń'}
                                          </button>
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {activeView === 'NPC' && (
            <>
              <section className="hero parchment-panel">
                <div>
                  <p className="eyebrow">NPC</p>
                  <h1>{active?.name ?? 'Brak kampanii'}</h1>
                  <p>
                    Towarzysze i najemnicy ekspedycji. NPC mają własną pojemność,
                    ekwipunek, racje i znacznik ostatniego karmienia.
                  </p>
                </div>

                <button className="primary" onClick={openNewNpc} disabled={!activeId}>
                  <Plus size={16} />
                  Nowy NPC
                </button>
              </section>

              <section className="dashboard-grid">
                <div className="panel wide">
                  <div className="panel-title">
                    <Shield size={18} />
                    NPC i ekwipunek
                  </div>

                  {npcsLoading || npcItemsLoading ? (
                    <p className="muted">Ładowanie NPC…</p>
                  ) : npcs.length === 0 ? (
                    <div className="empty-state">
                      <p>W tej kampanii nie ma jeszcze NPC.</p>
                      <button className="primary" onClick={openNewNpc}>
                        <Plus size={16} />
                        Dodaj pierwszego NPC
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                      {npcs.map(npc => {
                        const usedSlots = usedSlotsForNpc(npc.id)
                        const currentItems = itemsForNpc(npc.id)

                        return (
                          <article className="entity-card" key={npc.id}>
                            <div className="entity-head">
                              <div>
                                <strong>{npc.name}</strong>
                                <span style={{ display: 'block', marginTop: 4 }}>
                                  NPC{npc.role ? ` • ${npc.role}` : ''}
                                </span>
                                <span style={{ display: 'block', marginTop: 4 }}>
                                  Ostatnio nakarmiony: {formatLastFed(npc.lastFedAt)}
                                  {' • '}Racje: {npcRationCounts.get(npc.id) ?? 0}
                                </span>
                              </div>

                              <div className="button-row">
                                <button className="secondary" onClick={() => openNewNpcItem(npc.id)}>
                                  <Package size={15} />
                                  Dodaj przedmiot
                                </button>
                                <button className="secondary" onClick={() => openEditNpc(npc)}>
                                  <Pencil size={15} />
                                  Edytuj
                                </button>
                                <button className="danger" onClick={() => removeNpc(npc)}>
                                  <Trash2 size={15} />
                                  Usuń
                                </button>
                              </div>
                            </div>

                            <div className="slot-line" style={{ marginTop: 12 }}>
                              <span>Sloty ekwipunku</span>
                              <b>{Number(usedSlots.toFixed(2))}/{npc.maxSlots}</b>
                            </div>

                            <div className="progress small">
                              <i
                                style={{
                                  width: `${Math.min(
                                    100,
                                    npc.maxSlots > 0 ? (usedSlots / npc.maxSlots) * 100 : 0
                                  )}%`,
                                }}
                              />
                            </div>

                            <div style={{ marginTop: 16 }}>
                              {currentItems.length === 0 ? (
                                <p className="muted">Brak przedmiotów.</p>
                              ) : (
                                <div style={{ display: 'grid', gap: 8 }}>
                                  {currentItems.map(item => (
                                    <div
                                      key={item.id}
                                      className="slot-line"
                                      style={inventoryHighlightStyle(item.category, isMagicalInventoryItem(item.catalogItemId))}
                                    >
                                      <span>
                                        <strong>{item.name}</strong>
                                        {' × '}{item.quantity}
                                        {' • '}{item.slotsPerUnit} slot./szt.
                                        {item.category === 'food' && ' • ŻYWNOŚĆ'}
                                        {item.category === 'light' &&
                                          ` • ŚWIATŁO ${item.lightMinutes ?? 60} min`}
                                        {item.category === 'weapon' &&
                                          ` • broń${item.weaponDamage ? ` • obrażenia ${item.weaponDamage}` : ''}`}
                                        {item.category === 'armor' &&
                                          ` • pancerz${item.armorClass ? ` • KP/AC ${item.armorClass}` : ''}`}
                                      </span>

                                      <span className="button-row">
                                        <button className="secondary" onClick={() => openEditNpcItem(item)}>
                                          <Pencil size={14} />
                                          Edytuj
                                        </button>
                                        <button className="danger" onClick={() => removeNpcItem(item)}>
                                          <Trash2 size={14} />
                                          Usuń
                                        </button>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {activeView === 'Biblioteka' && (
            <>
              <section className="hero parchment-panel">
                <div>
                  <p className="eyebrow">BIBLIOTEKA PRZEDMIOTÓW</p>
                  <h1>{active?.name ?? 'Brak aktywnej kampanii'}</h1>
                  <p>Wspólny katalog przedmiotów kampanii. Pozycje z tej biblioteki pojawiają się na liście rozwijanej przy dodawaniu ekwipunku.</p>
                </div>

                <div className="hero-tools">
                  <button className="secondary" onClick={exportCatalogCsv} disabled={!catalog.length}>Eksport CSV</button>
                  <button className="secondary" onClick={() => setShowCatalogImport(true)}>Import CSV</button>
                  <button className="primary" onClick={openNewCatalogItem}><Plus size={16} />Nowy przedmiot</button>
                </div>
              </section>

              <section className="panel">
                <div className="panel-title">
                  <Package size={18} />
                  Biblioteka kampanii
                  <span style={{ marginLeft: 'auto' }}>{catalog.length} pozycji</span>
                </div>

                {catalogLoading ? (
                  <p className="muted">Ładowanie biblioteki…</p>
                ) : catalog.length === 0 ? (
                  <div className="empty-state">
                    <p>Biblioteka jest jeszcze pusta.</p>
                    <div className="button-row">
                      <button className="secondary" onClick={addStarterCatalog}>Dodaj bazowe pozycje</button>
                      <button className="primary" onClick={openNewCatalogItem}><Plus size={16} />Dodaj pierwszy przedmiot</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="button-row" style={{ marginBottom: 16 }}>
                      <button className="secondary" onClick={addStarterCatalog}>Uzupełnij bazowe pozycje</button>
                    </div>

                    <div className="entity-grid">
                      {catalog.map(entry => (
                        <article
                          className="entity-card"
                          key={entry.id}
                          style={inventoryHighlightStyle(entry.category, entry.isMagical)}
                        >
                          <div className="entity-head">
                            <strong>{entry.name}</strong>
                            <span>
                              {catalogCategoryLabel(entry.category)}
                              {entry.isMagical ? ' • MAGICZNY' : ''}
                            </span>
                          </div>
                          <p className="muted" style={{ marginTop: 10 }}>{catalogItemDetails(entry)}</p>
                          <div className="button-row">
                            <button className="danger" onClick={() => removeCatalogEntry(entry)}>
                              <Trash2 size={15} />Usuń z biblioteki
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </section>

              <section className="panel" style={{ marginTop: 16 }}>
                <div className="panel-title">
                  <Beef size={18} />
                  Katalog zwierząt
                  <span style={{ marginLeft: 'auto' }}>{MOUNT_CATALOG.length} pozycji</span>
                </div>

                <p className="muted" style={{ marginBottom: 16 }}>
                  Gotowy katalog mountów. Udźwig uwzględnia już właściwość Sturdy (S).
                  Personality wybierasz przy dodawaniu konkretnego zwierzęcia do kampanii.
                </p>

                <div className="entity-grid">
                  {MOUNT_CATALOG.map(mount => (
                    <article className="entity-card" key={mount.name}>
                      <div className="entity-head">
                        <strong>{mount.name}</strong>
                        <span>{MOUNT_RARITY_LABEL[mount.rarity]}</span>
                      </div>
                      <p className="muted" style={{ marginTop: 10 }}>
                        Koszt {mount.cost} • {mount.gearSlots} slotów • {mountPropertyText(mount.properties)}
                      </p>
                      {mount.properties.length > 0 && (
                        <div style={{ display: 'grid', gap: 4, marginTop: 10 }}>
                          {mount.properties.map(code => (
                            <span className="muted" key={code}>
                              <strong>{code}</strong> — {MOUNT_PROPERTY_INFO[code].description}
                            </span>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>

                <div style={{ marginTop: 18 }}>
                  <div className="panel-title" style={{ marginBottom: 10 }}>
                    Personality
                  </div>
                  <div className="entity-grid">
                    {MOUNT_PERSONALITIES.map(personality => (
                      <article className="entity-card" key={personality.value}>
                        <div className="entity-head">
                          <strong>{personality.label}</strong>
                          <span>{personality.roll}</span>
                        </div>
                        <p className="muted" style={{ marginTop: 8 }}>{personality.behavior}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {activeView !== 'Dashboard' && activeView !== 'Postacie' && activeView !== 'NPC' && activeView !== 'Zwierzęta' && activeView !== 'Biblioteka' && (
            <section className="hero parchment-panel">
              <div>
                <p className="eyebrow">{activeView.toUpperCase()}</p>
                <h1>{activeView}</h1>
                <p>Ta sekcja zostanie podłączona do Supabase w kolejnym etapie.</p>
              </div>
            </section>
          )}

        </main>

      </div>

      {showAnimal && (
        <Modal
          onClose={() => {
            setShowAnimal(false)
            setEditingAnimal(null)
          }}
        >
          <p className="eyebrow">{editingAnimal ? 'EDYCJA ZWIERZĘCIA' : 'NOWE ZWIERZĘ'}</p>
          <h2>{editingAnimal ? 'Edytuj zwierzę' : 'Dodaj zwierzę'}</h2>

          {!editingAnimal && (
            <label>
              Gotowy katalog zwierząt
              <select
                value={selectedMountCatalogName}
                onChange={e => {
                  const selected = MOUNT_CATALOG.find(entry => entry.name === e.target.value)
                  setSelectedMountCatalogName(e.target.value)
                  if (selected) applyMountCatalogEntry(selected)
                }}
              >
                <option value="">— własne / ręczne —</option>
                {MOUNT_CATALOG.map(entry => (
                  <option key={entry.name} value={entry.name}>
                    {entry.name} • {entry.cost} • {MOUNT_RARITY_LABEL[entry.rarity]} • {entry.gearSlots} slotów
                  </option>
                ))}
              </select>
            </label>
          )}

          {selectedMountCatalogName && (() => {
            const selected = MOUNT_CATALOG.find(entry => entry.name === selectedMountCatalogName)
            if (!selected) return null
            return (
              <div
                style={{
                  padding: '10px 12px',
                  border: '1px solid rgba(180, 135, 60, 0.32)',
                  borderRadius: 8,
                  background: 'rgba(110, 83, 42, 0.10)',
                }}
              >
                <strong>{selected.name}</strong>
                <span className="muted" style={{ display: 'block', marginTop: 4 }}>
                  Koszt: {selected.cost} • Rzadkość: {MOUNT_RARITY_LABEL[selected.rarity]} • Udźwig: {selected.gearSlots}
                </span>
                <span className="muted" style={{ display: 'block', marginTop: 4 }}>
                  Właściwości: {mountPropertyText(selected.properties)}
                </span>
              </div>
            )
          })()}

          <label>
            Nazwa
            <input autoFocus value={animalName} onChange={e => setAnimalName(e.target.value)} />
          </label>

          <label>
            Typ
            <input
              value={animalType}
              onChange={e => setAnimalType(e.target.value)}
              placeholder="np. koń, muł, osioł"
            />
          </label>

          <label>
            Bazowy udźwig (sloty)
            <input
              type="number"
              min="0"
              step="1"
              value={animalBaseSlots}
              onChange={e => setAnimalBaseSlots(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>

          <label>
            Personality
            <select
              value={animalPersonality}
              onChange={e => setAnimalPersonality(e.target.value as Animal['personality'])}
            >
              <option value="">Nieustalona</option>
              {MOUNT_PERSONALITIES.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.roll}) — {option.behavior}
                </option>
              ))}
            </select>
          </label>

          <p className="muted">
            Personality: 2d6 + CHA mod. Good-Tempered (G) dodaje +2 do tego rzutu.
          </p>

          <p className="muted">
            Wóz nie zajmuje slotów zwierzęcia i zwiększa jego udźwig o 15.
            Jedno zwierzę może mieć tylko jeden wóz.
          </p>

          <button className="primary full" onClick={saveAnimal}>
            {editingAnimal ? 'Zapisz zmiany' : 'Dodaj zwierzę'}
          </button>
        </Modal>
      )}

      {showAnimalItem && (
        <Modal
          onClose={() => {
            setShowAnimalItem(false)
            setEditingAnimalItem(null)
          }}
        >
          <p className="eyebrow">
            {editingAnimalItem ? 'EDYCJA WYPOSAŻENIA' : 'WYPOSAŻENIE ZWIERZĘCIA'}
          </p>
          <h2>{editingAnimalItem ? 'Edytuj przedmiot' : 'Dodaj wyposażenie'}</h2>

          {!editingAnimalItem && (
            <label>
              Przedmiot z katalogu
              <select
                autoFocus
                value={animalItemCatalogItemId}
                onChange={e => {
                  const id = e.target.value
                  setAnimalItemCatalogItemId(id)
                  const selected = catalog.find(entry => entry.id === id)
                  if (selected) applyCatalogToAnimalItem(selected)
                }}
              >
                <option value="">— wybierz przedmiot —</option>
                {catalog
                  .filter(entry =>
                    !isWagonName(entry.name) ||
                    !animalHasWagon(animalItemAnimalId)
                  )
                  .map(entry => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                      {isWagonName(entry.name) ? ' • WÓZ (+15 udźwigu)' : ''}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {animalItemName && isWagonName(animalItemName) && (
            <div
              className="setup-banner"
              style={{
                border: '1px solid rgba(154, 118, 55, 0.85)',
                background:
                  'linear-gradient(135deg, rgba(112, 86, 43, 0.28), rgba(61, 72, 48, 0.28))',
              }}
            >
              <Truck size={18} />
              <div>
                <strong>Wóz — specjalne wyposażenie</strong>
                <span>
                  Nie zajmuje slotów zwierzęcia. Zwiększa jego udźwig o 15 slotów.
                </span>
              </div>
            </div>
          )}

          {!isWagonName(animalItemName) && (
            <label>
              Ilość
              <input
                type="number"
                min="1"
                value={animalItemQuantity}
                onChange={e =>
                  setAnimalItemQuantity(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </label>
          )}

          <button
            className="primary full"
            onClick={saveAnimalItem}
            disabled={!animalItemName.trim()}
          >
            {editingAnimalItem ? 'Zapisz zmiany' : 'Dodaj wyposażenie'}
          </button>
        </Modal>
      )}

      {showNpc && (
        <Modal
          onClose={() => {
            setShowNpc(false)
            setEditingNpc(null)
          }}
        >
          <p className="eyebrow">{editingNpc ? 'EDYCJA NPC' : 'NOWY NPC'}</p>
          <h2>{editingNpc ? 'Edytuj NPC' : 'Dodaj NPC'}</h2>

          <label>
            Nazwa
            <input autoFocus value={npcName} onChange={e => setNpcName(e.target.value)} />
          </label>

          <label>
            Rola / typ
            <input
              value={npcRole}
              onChange={e => setNpcRole(e.target.value)}
              placeholder="np. najemnik, przewodnik"
            />
          </label>

          <label>
            Maksymalna liczba slotów
            <input
              type="number"
              min="0"
              step="1"
              value={npcMaxSlots}
              onChange={e => setNpcMaxSlots(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>

          <button className="primary full" onClick={saveNpc}>
            {editingNpc ? 'Zapisz zmiany' : 'Dodaj NPC'}
          </button>
        </Modal>
      )}

      {showNpcItem && (
        <Modal
          onClose={() => {
            setShowNpcItem(false)
            setEditingNpcItem(null)
          }}
        >
          <p className="eyebrow">{editingNpcItem ? 'EDYCJA PRZEDMIOTU NPC' : 'NOWY PRZEDMIOT NPC'}</p>
          <h2>{editingNpcItem ? 'Edytuj przedmiot' : 'Dodaj do ekwipunku NPC'}</h2>

          {!editingNpcItem && (
            <label>
              Przedmiot z katalogu
              <select
                autoFocus
                value={npcItemCatalogItemId}
                onChange={e => {
                  const id = e.target.value
                  setNpcItemCatalogItemId(id)
                  const selected = catalog.find(entry => entry.id === id)
                  if (selected) applyCatalogToNpcItem(selected)
                }}
              >
                <option value="">— wybierz przedmiot —</option>
                {catalog
                  .filter(entry => !isWagonName(entry.name))
                  .map(entry => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
              </select>
            </label>
          )}

          {editingNpcItem && (
            <label>
              Nazwa
              <input value={npcItemName} onChange={e => setNpcItemName(e.target.value)} />
            </label>
          )}

          <label>
            Ilość
            <input
              type="number"
              min="1"
              value={npcItemQuantity}
              onChange={e => setNpcItemQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>

          <button className="primary full" onClick={saveNpcItem} disabled={!npcItemName.trim()}>
            {editingNpcItem ? 'Zapisz zmiany' : 'Dodaj przedmiot'}
          </button>
        </Modal>
      )}

      {showCharacter && (
        <Modal
          onClose={() => {
            setShowCharacter(false)
            setEditingCharacter(null)
          }}
        >
          <p className="eyebrow">
            {editingCharacter ? 'EDYCJA POSTACI' : 'NOWA POSTAĆ'}
          </p>

          <h2>
            {editingCharacter ? 'Edytuj postać' : 'Dodaj postać'}
          </h2>

          <label>
            Imię postaci
            <input
              autoFocus
              value={characterName}
              onChange={e => setCharacterName(e.target.value)}
              placeholder="np. Aric"
            />
          </label>

          <label>
            SIŁA
            <input
              type="number"
              min="1"
              max="30"
              value={characterStrength}
              onChange={e =>
                setCharacterStrength(
                  Math.min(30, Math.max(1, Number(e.target.value) || 1))
                )
              }
            />
          </label>

          <p className="muted">
            Sloty ekwipunku:{' '}
            <strong>{Math.max(10, characterStrength)}</strong>
          </p>

          <label>
            Złoto (gp)
            <input
              type="number"
              min="0"
              value={characterGold}
              onChange={e =>
                setCharacterGold(Math.max(0, Number(e.target.value) || 0))
              }
            />
          </label>

          <button
            className="primary full"
            onClick={saveCharacter}
            disabled={!characterName.trim()}
          >
            {editingCharacter ? 'Zapisz zmiany' : 'Dodaj postać'}
          </button>
        </Modal>
      )}

      {showItem && (
        <Modal
          onClose={() => {
            setShowItem(false)
            setEditingItem(null)
          }}
        >
          <p className="eyebrow">
            {editingItem ? 'EDYCJA PRZEDMIOTU' : 'NOWY PRZEDMIOT'}
          </p>
          <h2>{editingItem ? 'Edytuj przedmiot' : 'Dodaj do ekwipunku'}</h2>

          {!editingItem && (
            <>
              <label>
                Przedmiot z katalogu
                <select
                  autoFocus
                  value={itemCatalogItemId}
                  disabled={catalogLoading}
                  onChange={e => {
                    const selected = catalog.find(i => i.id === e.target.value)
                    setItemCatalogItemId(e.target.value)
                    if (selected) applyCatalogItem(selected)
                  }}
                >
                  <option value="">{catalogLoading ? 'Ładowanie katalogu…' : '— wybierz przedmiot —'}</option>
                  {catalog
                    .filter(entry => !isWagonName(entry.name))
                    .map(entry => (
                      <option key={entry.id} value={entry.id}>{entry.name}</option>
                    ))}
                </select>
              </label>

              <button className="secondary full" type="button" onClick={openNewCatalogItem}>
                <Plus size={16} />
                Dodaj nowy przedmiot na stałe do katalogu
              </button>
            </>
          )}

          {itemName && (
            <div className="setup-banner">
              <Package size={18} />
              <div>
                <strong>{itemName}</strong>
                <span>
                  {itemSlotsPerUnit} slot./szt.
                  {itemCategory === 'food' && ' • żywność'}
                  {itemCategory === 'light' && ` • światło ${itemLightMinutes} min`}
                  {itemCategory === 'weapon' && ` • broń${itemWeaponDamage ? ` • obrażenia ${itemWeaponDamage}` : ''}${itemWeaponRange ? ` • zasięg ${itemWeaponRange}` : ''}`}
                  {itemCategory === 'armor' && ` • pancerz${itemArmorClass ? ` • KP/AC ${itemArmorClass}` : ''}`}
                </span>
              </div>
            </div>
          )}

          <label>
            Ilość
            <input
              type="number"
              min="1"
              value={itemQuantity}
              onChange={e => setItemQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>

          <button className="primary full" onClick={saveItem} disabled={!itemName.trim()}>
            {editingItem ? 'Zapisz zmiany' : 'Dodaj przedmiot'}
          </button>
        </Modal>
      )}

      {showCatalogItem && (
        <Modal onClose={() => setShowCatalogItem(false)}>
          <p className="eyebrow">KATALOG KAMPANII</p>
          <h2>Nowy przedmiot katalogowy</h2>

          <label>
            Nazwa
            <input autoFocus value={catalogName} onChange={e => setCatalogName(e.target.value)} placeholder="np. Miecz długi" />
          </label>

          <label>
            Typ
            <select value={catalogCategory} onChange={e => setCatalogCategory(e.target.value as CatalogItemCategory)}>
              <option value="normal">Zwykły przedmiot</option>
              <option value="food">Żywność / racja</option>
              <option value="light">Źródło światła</option>
              <option value="weapon">Broń</option>
              <option value="armor">Pancerz / tarcza</option>
            </select>
          </label>

          <label>
            Sloty na 1 sztukę
            <input type="number" min="0" step="0.01" value={catalogSlotsPerUnit}
              onChange={e => setCatalogSlotsPerUnit(Math.max(0, Number(e.target.value) || 0))} />
          </label>

          <label>
            Ile sztuk mieści się w jednym slocie
            <input type="number" min="1" step="1" value={catalogSlotGroupSize}
              onChange={e => setCatalogSlotGroupSize(Math.max(1, Number(e.target.value) || 1))} />
          </label>

          <label>
            Ile pierwszych sztuk nie zajmuje slotów
            <input type="number" min="0" step="1" value={catalogFreeQuantity}
              onChange={e => setCatalogFreeQuantity(Math.max(0, Number(e.target.value) || 0))} />
          </label>

          {catalogCategory === 'light' && (
            <label>
              Czas światła jednej sztuki (minuty)
              <input type="number" min="1" value={catalogLightMinutes}
                onChange={e => setCatalogLightMinutes(Math.max(1, Number(e.target.value) || 1))} />
            </label>
          )}

          {catalogCategory === 'weapon' && (
            <>
              <label>Obrażenia<input value={catalogWeaponDamage} onChange={e => setCatalogWeaponDamage(e.target.value)} placeholder="np. 1d6" /></label>
              <label>Zasięg<input value={catalogWeaponRange} onChange={e => setCatalogWeaponRange(e.target.value)} placeholder="np. bliski" /></label>
              <label>Właściwości broni<input value={catalogWeaponProperties} onChange={e => setCatalogWeaponProperties(e.target.value)} placeholder="np. dwuręczna" /></label>
            </>
          )}

          {catalogCategory === 'armor' && (
            <>
              <label>KP / AC<input value={catalogArmorClass} onChange={e => setCatalogArmorClass(e.target.value)} placeholder="np. 14 albo +2" /></label>
              <label>Właściwości pancerza<input value={catalogArmorProperties} onChange={e => setCatalogArmorProperties(e.target.value)} placeholder="np. ciężki, tarcza" /></label>
            </>
          )}

          <label
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              padding: '10px 12px',
              border: '1px solid rgba(72, 118, 164, 0.55)',
              borderRadius: 8,
              background: 'rgba(55, 91, 132, 0.12)',
            }}
          >
            <input
              type="checkbox"
              checked={catalogIsMagical}
              onChange={e => setCatalogIsMagical(e.target.checked)}
              style={{ width: 'auto', margin: 0 }}
            />
            <span>
              <strong>Magiczny przedmiot</strong>
              <span className="muted" style={{ display: 'block', marginTop: 2 }}>
                Oznacz przedmiot niebieskim wyróżnieniem w bibliotece i ekwipunku.
              </span>
            </span>
          </label>

          {catalogIsMagical && (
            <label>
              Opis magicznych właściwości
              <textarea
                rows={5}
                value={catalogMagicDescription}
                onChange={e => setCatalogMagicDescription(e.target.value)}
                placeholder="np. +1 do ataków; świeci bladym światłem; raz dziennie pozwala..."
              />
            </label>
          )}

          <button className="primary full" onClick={saveCatalogItem} disabled={!catalogName.trim()}>
            Dodaj do katalogu
          </button>
          <p className="muted">Przedmiot będzie dostępny wszystkim użytkownikom tej kampanii.</p>
        </Modal>
      )}


      {showCatalogImport && (
        <Modal onClose={() => setShowCatalogImport(false)}>
          <p className="eyebrow">IMPORT BIBLIOTEKI</p>
          <h2>Importuj przedmioty z CSV</h2>
          <p className="muted">
            Każdy wiersz: nazwa;typ;sloty;czas światła;obrażenia;zasięg;właściwości broni;KP/AC;właściwości pancerza;wielkość grupy slotu;darmowa ilość;magiczny;opis magii.
          </p>
          <textarea
            rows={12}
            value={catalogImportText}
            onChange={e => setCatalogImportText(e.target.value)}
            placeholder={`name;category;slots;light_minutes;weapon_damage;weapon_range;weapon_properties;armor_class;armor_properties
Pochodnia;light;1;60;;;;;
Racje;food;1;;;;;;;3;0
Coin;normal;1;;;;;;;100;100`}
          />
          <button className="primary full" onClick={importCatalogCsv} disabled={!catalogImportText.trim()}>
            Importuj do kampanii
          </button>
          <p className="muted">Dozwolone typy: normal, food, light, weapon, armor. Nazwy już istniejące zostaną pominięte.</p>
        </Modal>
      )}

      {showCreate && (

        <Modal
          onClose={() =>
            setShowCreate(false)
          }
        >

          <p className="eyebrow">
            NOWA KAMPANIA
          </p>

          <h2>
            Utwórz kampanię
          </h2>

          <label>

            Nazwa kampanii

            <input
              autoFocus
              value={newCampaign}
              onChange={e =>
                setNewCampaign(
                  e.target.value
                )
              }
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  createCampaign()
                }
              }}
              placeholder="np. Grobowce Północy"
            />

          </label>

          <button
            className="primary full"
            onClick={createCampaign}
            disabled={
              authLoading ||
              !newCampaign.trim()
            }
          >
            Utwórz kampanię
          </button>

          <p className="muted">

            {isCloudMode
              ? 'Kampania zostanie zapisana w Supabase i otrzyma kod dołączenia.'
              : 'Kampania zostanie zapisana lokalnie w tej przeglądarce.'}

          </p>

        </Modal>

      )}

      {showJoin && (

        <Modal
          onClose={() =>
            setShowJoin(false)
          }
        >

          <p className="eyebrow">
            DOŁĄCZ DO KAMPANII
          </p>

          <h2>
            Wpisz kod kampanii
          </h2>

          <label>

            Kod dołączenia

            <input
              autoFocus
              value={joinCode}
              onChange={e =>
                setJoinCode(
                  e.target.value.toUpperCase()
                )
              }
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleJoin()
                }
              }}
              placeholder="np. A1B2C3D4E5"
            />

          </label>

          <button
            className="primary full"
            onClick={handleJoin}
            disabled={
              authLoading ||
              !joinCode.trim()
            }
          >
            Dołącz
          </button>

          <p className="muted">
            Kod otrzymasz od właściciela
            lub MG kampanii.
          </p>

        </Modal>

      )}

    </div>
  )
}

function Modal({
  children,
  onClose,
}: {
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="modal parchment-panel"
        onMouseDown={e =>
          e.stopPropagation()
        }
      >
        <button
          className="close"
          onClick={onClose}
        >
          <X />
        </button>

        {children}
      </div>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: ReactNode
  label: string
  value: string
  sub: string
  accent?: boolean
}) {
  return (
    <article
      className={`metric ${
        accent ? 'accent' : ''
      }`}
    >
      <div className="metric-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </article>
  )
}

export default App