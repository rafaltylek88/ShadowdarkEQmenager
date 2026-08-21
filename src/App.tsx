import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
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
  const [characterUsedSlots, setCharacterUsedSlots] = useState(0)

  const [items, setItems] = useState<CharacterItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [showItem, setShowItem] = useState(false)
  const [editingItem, setEditingItem] = useState<CharacterItem | null>(null)
  const [itemCharacterId, setItemCharacterId] = useState('')
  const [itemName, setItemName] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [itemSlotsPerUnit, setItemSlotsPerUnit] = useState(1)
  const [itemCategory, setItemCategory] = useState<ItemCategory>('normal')
  const [itemLightMinutes, setItemLightMinutes] = useState(60)

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

  const active =
    campaigns.find(c => c.id === activeId) ??
    campaigns[0]

  const characterSlots = useMemo(() => {
    const max = characters.reduce(
      (sum, character) => sum + Math.max(10, character.strength),
      0
    )

    const used = items.reduce(
      (sum, item) => sum + item.quantity * item.slotsPerUnit,
      0
    )

    return { used, max }
  }, [characters, items])

  const usedSlotsForCharacter = useCallback(
    (characterId: string) =>
      items
        .filter(item => item.characterId === characterId)
        .reduce(
          (sum, item) => sum + item.quantity * item.slotsPerUnit,
          0
        ),
    [items]
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
    setCharacterUsedSlots(0)
    setShowCharacter(true)
  }

  function openEditCharacter(character: Character) {
    setEditingCharacter(character)
    setCharacterName(character.name)
    setCharacterStrength(character.strength)
    setCharacterGold(character.gold)
    setCharacterUsedSlots(character.usedSlots)
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
          usedSlots: characterUsedSlots,
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

  function openNewItem(characterId: string) {
    setEditingItem(null)
    setItemCharacterId(characterId)
    setItemName('')
    setItemQuantity(1)
    setItemSlotsPerUnit(1)
    setItemCategory('normal')
    setItemLightMinutes(60)
    setShowItem(true)
  }

  function openEditItem(item: CharacterItem) {
    setEditingItem(item)
    setItemCharacterId(item.characterId)
    setItemName(item.name)
    setItemQuantity(item.quantity)
    setItemSlotsPerUnit(item.slotsPerUnit)
    setItemCategory(item.category)
    setItemLightMinutes(item.lightMinutes ?? 60)
    setShowItem(true)
  }

  async function saveItem() {
    if (!activeId || !itemCharacterId) {
      setError('Najpierw wybierz kampanię i postać.')
      return
    }

    if (!itemName.trim()) {
      setError('Przedmiot musi mieć nazwę.')
      return
    }

    try {
      if (editingItem) {
        await updateItem(editingItem.id, itemCharacterId, {
          name: itemName,
          quantity: itemQuantity,
          slotsPerUnit: itemSlotsPerUnit,
          category: itemCategory,
          lightMinutes: itemCategory === 'light' ? itemLightMinutes : null,
        })
        flash('Przedmiot został zaktualizowany.')
      } else {
        await createItem({
          campaignId: activeId,
          characterId: itemCharacterId,
          name: itemName,
          quantity: itemQuantity,
          slotsPerUnit: itemSlotsPerUnit,
          category: itemCategory,
          lightMinutes: itemCategory === 'light' ? itemLightMinutes : null,
        })
        flash('Przedmiot został dodany.')
      }

      setShowItem(false)
      setEditingItem(null)
      await Promise.all([refreshItems(), refreshCharacters()])
    } catch (e: any) {
      console.error('SAVE ITEM ERROR:', e)
      setError(e?.message || e?.details || 'Nie udało się zapisać przedmiotu.')
    }
  }

  async function removeItem(item: CharacterItem) {
    const confirmed = window.confirm(
      `Czy na pewno usunąć "${item.name}" z ekwipunku?`
    )
    if (!confirmed) return

    try {
      await deleteItem(item.id, item.characterId)
      flash('Przedmiot został usunięty.')
      await Promise.all([refreshItems(), refreshCharacters()])
    } catch (e: any) {
      console.error('DELETE ITEM ERROR:', e)
      setError(e?.message || e?.details || 'Nie udało się usunąć przedmiotu.')
    }
  }

  async function consumeOne(item: CharacterItem) {
    try {
      if (item.quantity <= 1) {
        await deleteItem(item.id, item.characterId)
      } else {
        await updateItem(item.id, item.characterId, {
          name: item.name,
          quantity: item.quantity - 1,
          slotsPerUnit: item.slotsPerUnit,
          category: item.category,
          lightMinutes: item.lightMinutes,
        })
      }

      flash(`Zużyto 1 × ${item.name}.`)
      await Promise.all([refreshItems(), refreshCharacters()])
    } catch (e: any) {
      console.error('CONSUME ITEM ERROR:', e)
      setError(e?.message || e?.details || 'Nie udało się zużyć przedmiotu.')
    }
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
              Etap 2A • postacie online
            </span>
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
              value={`${characterSlots.used} / ${characterSlots.max}`}
              sub={`${Math.max(0, characterSlots.max - characterSlots.used)} wolnych`}
            />

            <Metric
              icon={<Flame />}
              label="Światło"
              value="00:43:27"
              sub="Aric • pochodnia"
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

              <div className="light-row">

                <span>Niosący</span>
                <strong>Aric</strong>

                <span>Źródło</span>
                <strong>Pochodnia</strong>

              </div>

              <div className="timer">
                00:43:27
              </div>

              <div className="button-row">

                <button className="primary">
                  START / WZNÓW
                </button>

                <button className="secondary">
                  PAUZA
                </button>

                <button className="danger">
                  ZGAŚ
                </button>

              </div>

              <p className="muted">
                Stan licznika będzie zapisany
                w bazie i wspólny dla wszystkich
                członków kampanii w etapie światła.
              </p>

            </div>

            <div className="panel">

              <div className="panel-title">
                <Beef size={18} />
                Prowiant
              </div>

              <div className="ration-big">
                <strong>30</strong>
                <span>
                  racji dostępnych
                </span>
              </div>

              <div className="progress">
                <i
                  style={{
                    width: '66%',
                  }}
                />
              </div>

              <p>
                <b>5 dni</b> dla obecnej
                ekspedycji.
              </p>

              <button className="secondary full">
                Nakarm ekspedycję
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

                    return (
                      <article className="entity-card" key={character.id}>
                        <div className="entity-head">
                          <strong>{character.name}</strong>
                          <span>Postać</span>
                        </div>

                        <div className="slot-line">
                          <span>SIŁA {character.strength}</span>
                          <b>{character.usedSlots}/{maxSlots}</b>
                        </div>

                        <div className="progress small">
                          <i
                            style={{
                              width: `${Math.min(
                                100,
                                maxSlots > 0
                                  ? (character.usedSlots / maxSlots) * 100
                                  : 0
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="slot-line" style={{ marginTop: 12 }}>
                          <span>Złoto</span>
                          <b>{character.gold} gp</b>
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

          {activeView !== 'Dashboard' && activeView !== 'Postacie' && (
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

          {editingCharacter && (
            <label>
              Zajęte sloty
              <input
                type="number"
                min="0"
                value={characterUsedSlots}
                onChange={e =>
                  setCharacterUsedSlots(Math.max(0, Number(e.target.value) || 0))
                }
              />
            </label>
          )}

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

          <h2>
            {editingItem ? 'Edytuj przedmiot' : 'Dodaj do ekwipunku'}
          </h2>

          <label>
            Nazwa
            <input
              autoFocus
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              placeholder="np. Pochodnia"
            />
          </label>

          <label>
            Ilość
            <input
              type="number"
              min="1"
              value={itemQuantity}
              onChange={e =>
                setItemQuantity(Math.max(1, Number(e.target.value) || 1))
              }
            />
          </label>

          <label>
            Sloty na 1 sztukę
            <input
              type="number"
              min="0"
              step="0.25"
              value={itemSlotsPerUnit}
              onChange={e =>
                setItemSlotsPerUnit(Math.max(0, Number(e.target.value) || 0))
              }
            />
          </label>

          <label>
            Typ
            <select
              value={itemCategory}
              onChange={e => setItemCategory(e.target.value as ItemCategory)}
            >
              <option value="normal">Zwykły przedmiot</option>
              <option value="food">Żywność / racja</option>
              <option value="light">Źródło światła</option>
            </select>
          </label>

          {itemCategory === 'light' && (
            <label>
              Czas światła jednej sztuki (minuty)
              <input
                type="number"
                min="1"
                value={itemLightMinutes}
                onChange={e =>
                  setItemLightMinutes(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </label>
          )}

          <button
            className="primary full"
            onClick={saveItem}
            disabled={!itemName.trim()}
          >
            {editingItem ? 'Zapisz zmiany' : 'Dodaj przedmiot'}
          </button>
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