import { useEffect, useMemo, useState } from 'react'
import { Backpack, Beef, Building2, Castle, Coins, Flame, Gauge, Home, Menu, Plus, Shield, Users, X } from 'lucide-react'
import { supabaseEnabled } from './lib/supabase'
import type { Campaign, CharacterSummary } from './types'

const initialCampaigns: Campaign[] = [
  { id: 'demo-1', name: 'Cienie Królestwa', description: 'Kampania demonstracyjna', createdAt: new Date().toISOString() },
  { id: 'demo-2', name: 'Krypta Czarnego Słońca', description: 'Druga kampania', createdAt: new Date().toISOString() },
]

const summaries: CharacterSummary[] = [
  { id: '1', name: 'Aric', kind: 'Postać', strength: 14, usedSlots: 11, maxSlots: 14, gold: 127 },
  { id: '2', name: 'Beatrice', kind: 'Postać', strength: 12, usedSlots: 9, maxSlots: 12, gold: 63 },
  { id: '3', name: 'Tragarz', kind: 'NPC', strength: 10, usedSlots: 6, maxSlots: 10 },
  { id: '4', name: 'Burzowy', kind: 'Zwierzę', usedSlots: 12, maxSlots: 20 },
  { id: '5', name: 'Wóz główny', kind: 'Wóz', usedSlots: 27, maxSlots: 40 },
  { id: '6', name: 'Siedziba główna', kind: 'Siedziba', usedSlots: 120, maxSlots: 200 },
]

const nav = [
  ['Dashboard', Gauge], ['Postacie', Users], ['NPC', Shield], ['Zwierzęta', Beef], ['Wozy', Package],
  ['Siedziby', Castle], ['Ekwipunek wspólny', Backpack], ['Podsumowanie', Coins],
] as const

function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('sdm.campaigns')
    return saved ? JSON.parse(saved) : initialCampaigns
  })
  const [activeId, setActiveId] = useState(() => localStorage.getItem('sdm.activeCampaign') || campaigns[0]?.id)
  const [showCreate, setShowCreate] = useState(false)
  const [newCampaign, setNewCampaign] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => localStorage.setItem('sdm.campaigns', JSON.stringify(campaigns)), [campaigns])
  useEffect(() => { if (activeId) localStorage.setItem('sdm.activeCampaign', activeId) }, [activeId])

  const active = campaigns.find(c => c.id === activeId) ?? campaigns[0]
  const people = useMemo(() => summaries.filter(s => s.kind === 'Postać'), [])
  const totalGold = people.reduce((a, b) => a + (b.gold ?? 0), 0) + 600 + 1850

  function createCampaign() {
    const name = newCampaign.trim()
    if (!name) return
    const campaign = { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() }
    setCampaigns(prev => [...prev, campaign])
    setActiveId(campaign.id)
    setNewCampaign('')
    setShowCreate(false)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-button mobile-only" onClick={() => setMobileNav(v => !v)} aria-label="Menu"><Menu size={20}/></button>
        <div className="brand-mark">SD</div>
        <div className="brand-text"><strong>Shadowdark Manager</strong><span>menadżer drużyny i ekwipunku</span></div>
        <div className="sync-badge"><span className={supabaseEnabled ? 'dot online' : 'dot demo'}></span>{supabaseEnabled ? 'Synchronizacja aktywna' : 'Tryb demonstracyjny'}</div>
      </header>

      <div className="body-grid">
        <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
          <div className="campaign-label">KAMPANIA</div>
          <select value={active?.id} onChange={e => setActiveId(e.target.value)}>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="secondary full" onClick={() => setShowCreate(true)}><Plus size={16}/> Nowa kampania</button>
          <nav>{nav.map(([label, Icon], i) => <button key={label} className={i === 0 ? 'nav-active' : ''}><Icon size={17}/>{label}</button>)}</nav>
          <div className="sidebar-footer"><Home size={16}/><span>Etap 1 • fundament</span></div>
        </aside>

        <main>
          <section className="hero parchment-panel">
            <div><p className="eyebrow">AKTYWNA KAMPANIA</p><h1>{active?.name}</h1><p>Centrum zarządzania drużyną, zapasami i wyprawą.</p></div>
            <div className="crest"><Building2 size={28}/></div>
          </section>

          <section className="metric-grid">
            <Metric icon={<Users/>} label="Postacie" value="2" sub="aktywne" />
            <Metric icon={<Backpack/>} label="Sloty ekspedycji" value="65 / 96" sub="31 wolnych" />
            <Metric icon={<Flame/>} label="Światło" value="00:43:27" sub="Aric • pochodnia" accent />
            <Metric icon={<Coins/>} label="Majątek" value={`${totalGold.toLocaleString('pl-PL')} gp`} sub="łącznie" />
          </section>

          <section className="dashboard-grid">
            <div className="panel light-panel">
              <div className="panel-title"><Flame size={18}/> Aktywne źródło światła</div>
              <div className="light-row"><span>Niosący</span><strong>Aric</strong><span>Źródło</span><strong>Pochodnia</strong></div>
              <div className="timer">00:43:27</div>
              <div className="button-row"><button className="primary">START / WZNÓW</button><button className="secondary">PAUZA</button><button className="danger">ZGAŚ</button></div>
              <p className="muted">Pełna synchronizacja licznika zostanie podłączona w etapie światła.</p>
            </div>

            <div className="panel">
              <div className="panel-title"><Beef size={18}/> Prowiant</div>
              <div className="ration-big"><strong>30</strong><span>racji dostępnych</span></div>
              <div className="progress"><i style={{width:'66%'}}/></div>
              <p><b>5 dni</b> dla obecnej ekspedycji.</p>
              <button className="secondary full">Nakarm ekspedycję</button>
            </div>

            <div className="panel wide">
              <div className="panel-title"><Backpack size={18}/> Drużyna i zasoby</div>
              <div className="entity-grid">
                {summaries.map(item => (
                  <article className="entity-card" key={item.id}>
                    <div className="entity-head"><strong>{item.name}</strong><span>{item.kind}</span></div>
                    <div className="slot-line"><span>{item.kind === 'Postać' ? `SIŁA ${item.strength}` : 'Pojemność'}</span><b>{item.usedSlots}/{item.maxSlots}</b></div>
                    <div className="progress small"><i style={{width:`${Math.min(100,item.usedSlots/item.maxSlots*100)}%`}}/></div>
                  </article>
                ))}
              </div>
            </div>

            <div className="panel wide">
              <div className="panel-title"><Coins size={18}/> Podsumowanie majątku</div>
              <div className="wealth-grid"><div><span>Złoto osobiste</span><b>190 gp</b></div><div><span>Wspólne — ekspedycja</span><b>600 gp</b></div><div><span>W siedzibie</span><b>1 850 gp</b></div><div><span>Łącznie</span><b>{totalGold.toLocaleString('pl-PL')} gp</b></div></div>
            </div>
          </section>
        </main>
      </div>

      {showCreate && <div className="modal-backdrop" onMouseDown={() => setShowCreate(false)}><div className="modal parchment-panel" onMouseDown={e => e.stopPropagation()}><button className="close" onClick={()=>setShowCreate(false)}><X/></button><p className="eyebrow">NOWA KAMPANIA</p><h2>Utwórz kampanię</h2><label>Nazwa kampanii<input autoFocus value={newCampaign} onChange={e=>setNewCampaign(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createCampaign()} placeholder="np. Grobowce Północy"/></label><button className="primary full" onClick={createCampaign}>Utwórz kampanię</button></div></div>}
    </div>
  )
}

function Metric({icon,label,value,sub,accent=false}:{icon:React.ReactNode,label:string,value:string,sub:string,accent?:boolean}) {
  return <article className={`metric ${accent?'accent':''}`}><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></article>
}

export default App
