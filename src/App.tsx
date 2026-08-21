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
import type { CampaignLight } from './lib/light'
import { feedExpedition, transferRation } from './lib/rations'

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
  ['Wozy', Truck],
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
  const [showCatalogImport, setShowCatalogImport] = useState(false)
  const [catalogImportText, setCatalogImportText] = useState('')

  const [lightState, setLightState] = useState<CampaignLight | null>(null)
  const [lightLoading, setLightLoading] = useState(false)
  const [lightCharacterId, setLightCharacterId] = useState('')
  const [lightItemId, setLightItemId] = useState('')
  const [lightTransferCharacterId, setLightTransferCharacterId] = useState('')
  const [lightNow, setLightNow] = useState(() => Date.now())
  const [feedingExpedition, setFeedingExpedition] = useState(false)
  const [transferringRation, setTransferringRation] = useState(false)
  const [rationTransferFromId, setRationTransferFromId] = useState('')
  const [rationTransferToId, setRationTransferToId] = useState('')

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

  const totalGold = useMemo(
    () => characters.reduce((sum, character) => sum + character.gold, 0),
    [characters]
  )


  function normalizeInventoryName(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
  }

  function isRationItem(item: CharacterItem) {
    const itemName = normalizeInventoryName(item.name)
    const catalogName = normalizeInventoryName(
      catalog.find(entry => entry.id === item.catalogItemId)?.name ?? ''
    )

    return (
      item.category === 'food' &&
      ['ration', 'rations', 'racja', 'racje'].includes(
        itemName || catalogName
      )
    )
  }

  const rationCounts = useMemo(() => {
    const counts = new Map<string, number>()

    for (const character of characters) {
      counts.set(character.id, 0)
    }

    for (const item of items) {
      if (!isRationItem(item)) continue
      counts.set(
        item.characterId,
        (counts.get(item.characterId) ?? 0) + item.quantity
      )
    }

    return counts
  }, [characters, items, catalog])

  const totalRations = useMemo(
    () =>
      Array.from(rationCounts.values()).reduce(
        (sum, quantity) => sum + quantity,
        0
      ),
    [rationCounts]
  )

  const expeditionFeedsAvailable = useMemo(() => {
    if (!characters.length) return 0

    return Math.min(
      ...characters.map(character => rationCounts.get(character.id) ?? 0)
    )
  }, [characters, rationCounts])


  const charactersMissingRations = useMemo(
    () =>
      characters.filter(
        character => (rationCounts.get(character.id) ?? 0) < 1
      ),
    [characters, rationCounts]
  )

  const rationDonors = useMemo(
    () =>
      characters
        .filter(character => (rationCounts.get(character.id) ?? 0) > 1)
        .sort(
          (a, b) =>
            (rationCounts.get(b.id) ?? 0) -
            (rationCounts.get(a.id) ?? 0)
        ),
    [characters, rationCounts]
  )

  useEffect(() => {
    if (
      !charactersMissingRations.some(
        character => character.id === rationTransferToId
      )
    ) {
      setRationTransferToId(charactersMissingRations[0]?.id ?? '')
    }

    if (
      !rationDonors.some(
        character => character.id === rationTransferFromId
      )
    ) {
      setRationTransferFromId(rationDonors[0]?.id ?? '')
    }
  }, [
    charactersMissingRations,
    rationDonors,
    rationTransferFromId,
    rationTransferToId,
  ])

  async function handleTransferRation() {
    if (!activeId || !rationTransferFromId || !rationTransferToId) {
      setError('Wybierz dawcę i odbiorcę racji.')
      return
    }

    if (rationTransferFromId === rationTransferToId) {
      setError('Dawca i odbiorca muszą być różnymi postaciami.')
      return
    }

    setTransferringRation(true)

    try {
      await transferRation(
        activeId,
        rationTransferFromId,
        rationTransferToId
      )

      await Promise.all([refreshItems(), refreshCharacters()])

      const from = characters.find(
        character => character.id === rationTransferFromId
      )
      const to = characters.find(
        character => character.id === rationTransferToId
      )

      flash(
        `Przekazano 1 rację: ${from?.name ?? 'dawca'} → ${
          to?.name ?? 'odbiorca'
        }.`
      )
    } catch (e: any) {
      console.error('TRANSFER RATION ERROR:', e)
      setError(
        e?.message ||
          e?.details ||
          'Nie udało się przekazać racji.'
      )
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
      await Promise.all([refreshItems(), refreshCharacters()])
      flash(
        `Nakarmiono ekspedycję: ${result.charactersFed} ${
          result.charactersFed === 1 ? 'postać' : 'postaci'
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

  const availableLightItems = useMemo(
    () =>
      items.filter(
        item =>
          item.category === 'light' &&
          !item.isActiveLight &&
          item.quantity > 0 &&
          (item.lightMinutes ?? 0) > 0
      ),
    [items]
  )

  const lightItemsForSelectedCharacter = useMemo(
    () => availableLightItems.filter(item => item.characterId === lightCharacterId),
    [availableLightItems, lightCharacterId]
  )

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

  const lightCarrierName =
    lightState?.carrierName ||
    characters.find(character => character.id === lightCharacterId)?.name ||
    '—'

  const lightSourceName =
    lightState?.sourceName ||
    availableLightItems.find(item => item.id === lightItemId)?.name ||
    '—'


  const lightRuleForItem = useCallback(
    (item: CharacterItem) =>
      catalog.find(entry => entry.id === item.catalogItemId) ?? null,
    [catalog]
  )

  const lightFuelStatus = useCallback(
    (item: CharacterItem) => {
      const rule = lightRuleForItem(item)
      if (!rule || rule.lightConsumesSource || !rule.lightFuelItemName) return null

      const fuelCatalogIds = new Set(
        catalog
          .filter(entry =>
            entry.name.trim().toLowerCase() === rule.lightFuelItemName!.trim().toLowerCase()
          )
          .map(entry => entry.id)
      )

      const normalizeName = (value: string) =>
        value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

      const expectedName = normalizeName(rule.lightFuelItemName)
      const available = items
        .filter(candidate => {
          if (candidate.characterId !== item.characterId) return false
          if (candidate.catalogItemId && fuelCatalogIds.has(candidate.catalogItemId)) return true
          return normalizeName(candidate.name) === expectedName
        })
        .reduce((sum, candidate) => sum + candidate.quantity, 0)

      return {
        name: rule.lightFuelItemName,
        required: Math.max(1, rule.lightFuelQuantity || 1),
        available,
      }
    },
    [items, catalog, lightRuleForItem]
  )

  const selectedLightItem = useMemo(
    () => lightItemsForSelectedCharacter.find(item => item.id === lightItemId) ?? null,
    [lightItemsForSelectedCharacter, lightItemId]
  )

  const selectedLightFuel = selectedLightItem
    ? lightFuelStatus(selectedLightItem)
    : null

  const selectedLightMissingFuel = Boolean(
    selectedLightFuel &&
    selectedLightFuel.available < selectedLightFuel.required
  )

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
        await Promise.all([refreshItems(), refreshCharacters()])
      })
      .catch(() => undefined)
  }, [activeId, lightState?.status, lightRemainingSeconds, refreshItems, refreshCharacters])

  useEffect(() => {
    if (lightState?.status === 'running' || lightState?.status === 'paused') return

    setLightCharacterId(current => {
      if (availableLightItems.some(item => item.characterId === current)) return current
      return availableLightItems[0]?.characterId ?? ''
    })
  }, [availableLightItems, lightState?.status])

  useEffect(() => {
    if (lightState?.status === 'running' || lightState?.status === 'paused') return

    setLightItemId(current => {
      if (lightItemsForSelectedCharacter.some(item => item.id === current)) return current
      return lightItemsForSelectedCharacter[0]?.id ?? ''
    })
  }, [lightItemsForSelectedCharacter, lightState?.status])


  useEffect(() => {
    if (!lightState || lightState.status === 'off') {
      setLightTransferCharacterId('')
      return
    }

    setLightTransferCharacterId(current => {
      if (current && current !== lightState.characterId && characters.some(c => c.id === current)) {
        return current
      }
      return characters.find(c => c.id !== lightState.characterId)?.id ?? ''
    })
  }, [characters, lightState?.characterId, lightState?.status])

  async function handleLightStartOrResume() {
    if (!activeId) return

    try {
      setLightLoading(true)

      if (lightState?.status === 'paused') {
        setLightState(await resumeCampaignLight(activeId))
        setLightNow(Date.now())
        return
      }

      if (!lightItemId) {
        setError('Wybierz postać i źródło światła z jej ekwipunku.')
        return
      }

      setLightState(await startCampaignLight(activeId, lightItemId))
      setLightNow(Date.now())
      await Promise.all([refreshItems(), refreshCharacters()])
      flash('Źródło światła zostało zapalone. Zużyto 1 sztukę.')
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
      await Promise.all([refreshItems(), refreshCharacters()])
      flash('Światło zgaszone.')
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zgasić światła.')
    } finally {
      setLightLoading(false)
    }
  }


  async function handleLightTransfer() {
    if (!activeId || !lightTransferCharacterId || !lightState || lightState.status === 'off') return

    try {
      setLightLoading(true)
      const next = await transferCampaignLight(activeId, lightTransferCharacterId)
      setLightState(next)
      setLightNow(Date.now())
      await Promise.all([refreshItems(), refreshCharacters()])
      const target = characters.find(c => c.id === lightTransferCharacterId)
      flash(`Przekazano światło i przedmiot: ${target?.name ?? 'inna postać'}.`)
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się przekazać światła.')
    } finally {
      setLightLoading(false)
    }
  }

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
        armorClass = '', armorProperties = '', slotGroupRaw = '1', freeQuantityRaw = '0'] = cols

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

      return {
        name, category, slotsPerUnit, slotGroupSize, freeQuantity,
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
    const header = 'name;category;slots;light_minutes;weapon_damage;weapon_range;weapon_properties;armor_class;armor_properties;slot_group_size;free_quantity'
    const rows = catalog.map(entry =>
      [entry.name, entry.category, entry.slotsPerUnit, entry.lightMinutes ?? '',
       entry.weaponDamage ?? '', entry.weaponRange ?? '', entry.weaponProperties ?? '',
       entry.armorClass ?? '', entry.armorProperties ?? '', entry.slotGroupSize, entry.freeQuantity]
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
              Etap 2G.1 • przekazywanie racji</span>
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
              icon={<Flame />}
              label="Światło"
              value={formatTimer(lightRemainingSeconds)}
              sub={
                lightIsActive || lightState?.status === 'paused'
                  ? `${lightCarrierName} • ${lightSourceName}`
                  : 'brak aktywnego światła'
              }
              accent
            />

            <Metric
              icon={<Coins />}
              label="Majątek"
              value={`${totalGold.toLocaleString(
                'pl-PL'
              )} gp`}
              sub="łącznie"
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
                    <strong>{lightCarrierName}</strong>

                    <span>Źródło</span>
                    <strong>{lightSourceName}</strong>
                  </div>

                  <div className="light-row">
                    <label>
                      Przekaż światło
                      <select
                        value={lightTransferCharacterId}
                        onChange={e => setLightTransferCharacterId(e.target.value)}
                        disabled={lightLoading || characters.length < 2}
                      >
                        {characters.length < 2 && (
                          <option value="">Brak innej postaci</option>
                        )}
                        {characters
                          .filter(character => character.id !== lightState.characterId)
                          .map(character => (
                            <option key={character.id} value={character.id}>
                              {character.name}
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
                      disabled={lightLoading || availableLightItems.length === 0}
                    >
                      {availableLightItems.length === 0 && (
                        <option value="">Brak źródeł światła</option>
                      )}
                      {characters
                        .filter(character =>
                          availableLightItems.some(item => item.characterId === character.id)
                        )
                        .map(character => (
                          <option key={character.id} value={character.id}>
                            {character.name}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label>
                    Źródło
                    <select
                      value={lightItemId}
                      onChange={e => setLightItemId(e.target.value)}
                      disabled={lightLoading || lightItemsForSelectedCharacter.length === 0}
                    >
                      {lightItemsForSelectedCharacter.length === 0 && (
                        <option value="">Brak źródła</option>
                      )}
                      {lightItemsForSelectedCharacter.map(item => {
                        const fuel = lightFuelStatus(item)
                        return (
                          <option key={item.id} value={item.id}>
                            {item.name} × {item.quantity} • {item.lightMinutes} min
                            {fuel ? ` • paliwo: ${fuel.name} ${fuel.available}/${fuel.required}${fuel.available < fuel.required ? ' • BRAK PALIWA' : ''}` : ''}
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

              {charactersMissingRations.length > 0 ? (
                <div className="setup-banner" style={{ marginBottom: 14 }}>
                  <Beef size={18} />
                  <div>
                    <strong>Brakuje racji</strong>
                    <span>
                      {charactersMissingRations
                        .map(character => character.name)
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

              {charactersMissingRations.length > 0 && (
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
                          value={rationTransferFromId}
                          onChange={e =>
                            setRationTransferFromId(e.target.value)
                          }
                        >
                          {rationDonors.map(character => (
                            <option key={character.id} value={character.id}>
                              {character.name} • racje:{' '}
                              {rationCounts.get(character.id) ?? 0} • sloty:{' '}
                              {Number(
                                usedSlotsForCharacter(character.id).toFixed(2)
                              )}
                              /{Math.max(10, character.strength)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Odbiorca
                        <select
                          value={rationTransferToId}
                          onChange={e =>
                            setRationTransferToId(e.target.value)
                          }
                        >
                          {charactersMissingRations.map(character => (
                            <option key={character.id} value={character.id}>
                              {character.name} • racje:{' '}
                              {rationCounts.get(character.id) ?? 0} • sloty:{' '}
                              {Number(
                                usedSlotsForCharacter(character.id).toFixed(2)
                              )}
                              /{Math.max(10, character.strength)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        className="secondary full"
                        onClick={handleTransferRation}
                        disabled={
                          transferringRation ||
                          !rationTransferFromId ||
                          !rationTransferToId
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
                  charactersMissingRations.length > 0
                }
              >
                <Utensils size={16} />
                {feedingExpedition ? 'Karmienie…' : 'Nakarm ekspedycję'}
              </button>

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
                    Złoto osobiste
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
                                  {' • '}Racje: {rationCounts.get(character.id) ?? 0}
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
                                      style={{
                                        borderTop: '1px solid rgba(180, 135, 60, 0.25)',
                                        paddingTop: 8,
                                        alignItems: 'center',
                                      }}
                                    >
                                      <span>
                                        <strong>{item.name}</strong>
                                        {' × '}
                                        {item.quantity}
                                        {' • '}
                                        {item.slotsPerUnit} slot./szt.
                                        {item.category === 'food' && ' • żywność'}
                                        {item.category === 'light' &&
                                          ` • światło ${item.lightMinutes ?? 60} min`}
                                        {item.category === 'weapon' &&
                                          ` • broń${item.weaponDamage ? ` • obrażenia ${item.weaponDamage}` : ''}${item.weaponRange ? ` • zasięg ${item.weaponRange}` : ''}`}
                                        {item.category === 'armor' &&
                                          ` • pancerz${item.armorClass ? ` • KP/AC ${item.armorClass}` : ''}`}
                                        {item.category === 'weapon' && item.weaponProperties &&
                                          ` • ${item.weaponProperties}`}
                                        {item.category === 'armor' && item.armorProperties &&
                                          ` • ${item.armorProperties}`}
                                        {item.isActiveLight && ' • AKTYWNE ŚWIATŁO'}
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
                        <article className="entity-card" key={entry.id}>
                          <div className="entity-head">
                            <strong>{entry.name}</strong>
                            <span>{catalogCategoryLabel(entry.category)}</span>
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
            </>
          )}

          {activeView !== 'Dashboard' && activeView !== 'Postacie' && activeView !== 'Biblioteka' && (
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
                  {catalog.map(entry => (
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
            Każdy wiersz: nazwa;typ;sloty;czas światła;obrażenia;zasięg;właściwości broni;KP/AC;właściwości pancerza;wielkość grupy slotu;darmowa ilość.
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