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
  Plus,
  Shield,
  Truck,
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

import type { Campaign, CharacterSummary } from './types'

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

const summaries: CharacterSummary[] = [
  {
    id: '1',
    name: 'Aric',
    kind: 'Postać',
    strength: 14,
    usedSlots: 11,
    maxSlots: 14,
    gold: 127,
  },
  {
    id: '2',
    name: 'Beatrice',
    kind: 'Postać',
    strength: 12,
    usedSlots: 9,
    maxSlots: 12,
    gold: 63,
  },
  {
    id: '3',
    name: 'Tragarz',
    kind: 'NPC',
    strength: 10,
    usedSlots: 6,
    maxSlots: 10,
  },
  {
    id: '4',
    name: 'Burzowy',
    kind: 'Zwierzę',
    usedSlots: 12,
    maxSlots: 20,
  },
  {
    id: '5',
    name: 'Wóz główny',
    kind: 'Wóz',
    usedSlots: 27,
    maxSlots: 40,
  },
  {
    id: '6',
    name: 'Siedziba główna',
    kind: 'Siedziba',
    usedSlots: 120,
    maxSlots: 200,
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

  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const active =
    campaigns.find(c => c.id === activeId) ??
    campaigns[0]

  const people = useMemo(
    () =>
      summaries.filter(
        s => s.kind === 'Postać'
      ),
    []
  )

  const totalGold =
    people.reduce(
      (a, b) => a + (b.gold ?? 0),
      0
    ) +
    600 +
    1850

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
            {nav.map(
              ([label, Icon], i) => (
                <button
                  key={label}
                  className={
                    i === 0
                      ? 'nav-active'
                      : ''
                  }
                >
                  <Icon size={17} />
                  {label}
                </button>
              )
            )}
          </nav>

          <div className="sidebar-footer">
            <Home size={16} />

            <span>
              Etap 1B • kampanie i synchronizacja
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
              value="2"
              sub="aktywne"
            />

            <Metric
              icon={<Backpack />}
              label="Sloty ekspedycji"
              value="65 / 96"
              sub="31 wolnych"
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
                <Backpack size={18} />
                Drużyna i zasoby
              </div>

              <div className="entity-grid">

                {summaries.map(item => (

                  <article
                    className="entity-card"
                    key={item.id}
                  >

                    <div className="entity-head">

                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        {item.kind}
                      </span>

                    </div>

                    <div className="slot-line">

                      <span>
                        {item.kind ===
                        'Postać'
                          ? `SIŁA ${item.strength}`
                          : 'Pojemność'}
                      </span>

                      <b>
                        {item.usedSlots}/
                        {item.maxSlots}
                      </b>

                    </div>

                    <div className="progress small">

                      <i
                        style={{
                          width: `${Math.min(
                            100,
                            (item.usedSlots /
                              item.maxSlots) *
                              100
                          )}%`,
                        }}
                      />

                    </div>

                  </article>

                ))}

              </div>

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
                  <b>190 gp</b>
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
                    {totalGold.toLocaleString(
                      'pl-PL'
                    )}{' '}
                    gp
                  </b>
                </div>

              </div>

            </div>

          </section>

        </main>

      </div>

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
