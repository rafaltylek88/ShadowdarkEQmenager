import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  ArrowRightLeft,
  Backpack,
  Beef,
  BookOpen,
  Building2,
  Castle,
  Coins,
  Copy,
  Download,
  Flame,
  Gauge,
  Home,
  Hand,
  KeyRound,
  Menu,
  Map as MapIcon,
  Package,
  Save,
  Pencil,
  Plus,
  Shield,
  ScrollText,
  Skull,
  Trash2,
  Truck,
  Upload,
  Utensils,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

import { supabase, supabaseEnabled } from './lib/supabase'
import {
  createMapMarker,
  deleteMapMarker,
  hideCampaignHex,
  loadMapMarkers,
  loadRevealedCampaignHexes,
  revealCampaignHex,
  updateMapMarker,
} from './lib/mapState'
import type { CampaignMapMarker, MapMarkerType } from './lib/mapState'
import {
  createChronicleEntry,
  deleteChronicleEntry,
  loadChronicleEntries,
  updateChronicleEntry,
} from './lib/chronicle'
import type { ChronicleEntry, ChronicleSeason } from './lib/chronicle'
import {
  loadCharacterMemorials,
  markCharacterDead,
  restoreCharacterFromCemetery,
} from './lib/cemetery'
import type { CharacterMemorial } from './lib/cemetery'
import {
  createTreasureItem,
  deleteTreasureItem,
  loadTreasureItems,
} from './lib/treasure'
import type { TreasureItem } from './lib/treasure'
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
import { createStoryCharacter, deleteStoryCharacter, loadStoryCharacters, updateStoryCharacter } from './lib/storyCharacters'
import type { StoryCharacter } from './lib/storyCharacters'
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
import { setCharacterItemQuickpull } from './lib/quickpull'
import { setCharacterItemEquipped } from './lib/equipment'
import {
  createCatalogItem,
  deleteCatalogItem,
  loadCatalog,
  updateCatalogItem,
} from './lib/catalog'
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
import {
  BASTION_TYPES,
  BASTION_UPGRADES,
  addBastionUpgrade,
  createBastion,
  deleteBastion,
  loadBastions,
  loadBastionUpgrades,
  removeBastionUpgrade,
  repairBastion,
  setBastionHp,
} from './lib/bastions'
import type { Bastion, BastionTypeId, BastionUpgrade } from './lib/bastions'
import { loadBastionItems } from './lib/bastionItems'
import type { BastionItem } from './lib/bastionItems'
import { buyInventoryItem, sellInventoryItem } from './lib/trade'
import type { InventoryOwnerType } from './lib/trade'
import {
  addCampaignHistory,
  loadCampaignHistory,
  markCampaignHistoryUndone,
} from './lib/history'
import type {
  HistoryEntry,
  HistoryEventType,
  HistoryUndoPayload,
} from './lib/history'
import {
  adjustContainerInventoryContent,
  consumeInventoryItemUse,
  setInventoryItemQuantity,
  transferInventoryItem,
} from './lib/inventoryOps'

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
  ['Postacie Fabularne', UserPlus],
  ['Zwierzęta', Beef],
  ['Bastiony', Castle],
  ['Mapa', MapIcon],
  ['Biblioteka', Package],
  ['Kronika', ScrollText],
  ['Cmentarz', Skull],
  ['Skrzynia ze skarbami', Coins],
  ['Historia', ArrowRightLeft],
  ['Podsumowanie', Coins],
] as const

function statModifier(stat: number) {
  if (stat <= 3) return -4
  if (stat <= 5) return -3
  if (stat <= 7) return -2
  if (stat <= 9) return -1
  if (stat <= 11) return 0
  if (stat <= 13) return 1
  if (stat <= 15) return 2
  if (stat <= 17) return 3
  return 4
}

function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : String(value)
}

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
  const [showBackupMenu, setShowBackupMenu] = useState(false)
  const [backupRestoreFile, setBackupRestoreFile] = useState<File | null>(null)
  const [backupRestoreData, setBackupRestoreData] = useState<any | null>(null)
  const [backupRestoreBusy, setBackupRestoreBusy] = useState(false)
  const [backupRestoreConfirm, setBackupRestoreConfirm] = useState('')

  const [newCampaign, setNewCampaign] = useState('')
  const [joinCode, setJoinCode] = useState('')

  const [mobileNav, setMobileNav] = useState(false)
  const [activeView, setActiveView] = useState<(typeof nav)[number][0]>('Dashboard')
  const [mapDiagnosticMode, setMapDiagnosticMode] = useState(false)
  const [mapGmMode, setMapGmMode] = useState(false)
  const [mapGmUnlocked, setMapGmUnlocked] = useState(false)
  const [showMapGmCode, setShowMapGmCode] = useState(false)
  const [mapGmCode, setMapGmCode] = useState('')
  const [mapGmCodeError, setMapGmCodeError] = useState(false)
  const [mapRevealedHexes, setMapRevealedHexes] = useState<Set<string>>(
    () => new Set()
  )
  const [mapLoading, setMapLoading] = useState(false)
  const [mapMarkers, setMapMarkers] = useState<CampaignMapMarker[]>([])
  const [mapMarkersLoading, setMapMarkersLoading] = useState(false)
  const [mapTool, setMapTool] = useState<'fog' | 'markers'>('markers')
  const [showMapMarker, setShowMapMarker] = useState(false)
  const [editingMapMarker, setEditingMapMarker] = useState<CampaignMapMarker | null>(null)
  const [mapMarkerHexId, setMapMarkerHexId] = useState('')
  const [mapMarkerType, setMapMarkerType] = useState<MapMarkerType>('location')
  const [mapMarkerName, setMapMarkerName] = useState('')
  const [mapMarkerNote, setMapMarkerNote] = useState('')
  const [mapMarkerHexAction, setMapMarkerHexAction] = useState<'keep' | 'reveal' | 'hide'>('keep')
  const [selectedLegendMarker, setSelectedLegendMarker] = useState<CampaignMapMarker | null>(null)
  const [selectedHexId, setSelectedHexId] = useState<string | null>(null)
  const [chronicleEntries, setChronicleEntries] = useState<ChronicleEntry[]>([])
  const [chronicleLoading, setChronicleLoading] = useState(false)
  const [selectedChronicleId, setSelectedChronicleId] = useState<string | null>(null)
  const [showChronicleEditor, setShowChronicleEditor] = useState(false)
  const [editingChronicle, setEditingChronicle] = useState<ChronicleEntry | null>(null)
  const [chronicleTitle, setChronicleTitle] = useState('')
  const [chronicleSession, setChronicleSession] = useState(1)
  const [chronicleDay, setChronicleDay] = useState(1)
  const [chronicleSeason, setChronicleSeason] = useState<ChronicleSeason>('Wiosna')
  const [chronicleContent, setChronicleContent] = useState('')
  const [chronicleMentionQuery, setChronicleMentionQuery] = useState<string | null>(null)
  const [chronicleMentionStart, setChronicleMentionStart] = useState<number | null>(null)
  const [chronicleMentionCursor, setChronicleMentionCursor] = useState(0)
  const [chronicleLinkedStoryCharacter, setChronicleLinkedStoryCharacter] = useState<StoryCharacter | null>(null)
  const [chronicleLinkedMarker, setChronicleLinkedMarker] = useState<CampaignMapMarker | null>(null)



  const [message, setMessage] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<'all' | HistoryEventType>('all')
  const [undoingHistoryId, setUndoingHistoryId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [magicDescriptionItem, setMagicDescriptionItem] = useState<{
    name: string
    description: string
  } | null>(null)
  const [descriptionItem, setDescriptionItem] = useState<{
    name: string
    description: string
  } | null>(null)

  const [characters, setCharacters] = useState<Character[]>([])
  const [charactersLoading, setCharactersLoading] = useState(false)
  const [characterMemorials, setCharacterMemorials] = useState<CharacterMemorial[]>([])
  const [cemeteryLoading, setCemeteryLoading] = useState(false)
  const [cemeterySelectedCharacterId, setCemeterySelectedCharacterId] = useState<string | null>(null)
  const [treasureItems, setTreasureItems] = useState<TreasureItem[]>([])
  const [treasureLoading, setTreasureLoading] = useState(false)
  const [showTreasureAdd, setShowTreasureAdd] = useState(false)
  const [treasureName, setTreasureName] = useState('')
  const [treasureQuantity, setTreasureQuantity] = useState(1)
  const [treasureCategory, setTreasureCategory] = useState<ItemCategory>('normal')
  const [treasureRecipientId, setTreasureRecipientId] = useState('')
  const [treasureTransferItem, setTreasureTransferItem] = useState<TreasureItem | null>(null)
  const [showDeathModal, setShowDeathModal] = useState(false)
  const [deathCharacter, setDeathCharacter] = useState<Character | null>(null)
  const [deathDay, setDeathDay] = useState('')
  const [deathSession, setDeathSession] = useState('')
  const [deathCause, setDeathCause] = useState('')

  const deadCharacterIds = useMemo(
    () => new Set(characterMemorials.map(memorial => memorial.characterId)),
    [characterMemorials]
  )

  const activeCharacters = useMemo(
    () => characters.filter(character => !deadCharacterIds.has(character.id)),
    [characters, deadCharacterIds]
  )

  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)
  const [showCharacter, setShowCharacter] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [coinCalcDrafts, setCoinCalcDrafts] = useState<Record<string, string>>({})
  const [hpCalcDrafts, setHpCalcDrafts] = useState<Record<string, string>>({})
  const [xpCalcDrafts, setXpCalcDrafts] = useState<Record<string, string>>({})
  const [characterName, setCharacterName] = useState('')
  const [characterStrength, setCharacterStrength] = useState(10)
  const [characterDexterity, setCharacterDexterity] = useState(10)
  const [characterConstitution, setCharacterConstitution] = useState(10)
  const [characterIntelligence, setCharacterIntelligence] = useState(10)
  const [characterWisdom, setCharacterWisdom] = useState(10)
  const [characterCharisma, setCharacterCharisma] = useState(10)
  const [characterGold, setCharacterGold] = useState(0)
  const [characterCurrentHp, setCharacterCurrentHp] = useState(1)
  const [characterMaxHp, setCharacterMaxHp] = useState(1)
  const [characterTemporaryHp, setCharacterTemporaryHp] = useState(0)
  const [characterBonusSlots, setCharacterBonusSlots] = useState(0)
  const [characterAncestry, setCharacterAncestry] = useState('')
  const [characterClassName, setCharacterClassName] = useState('')
  const [characterLevel, setCharacterLevel] = useState(1)
  const [characterXp, setCharacterXp] = useState(0)
  const [characterXpNext, setCharacterXpNext] = useState(10)
  const [characterTitle, setCharacterTitle] = useState('')
  const [characterAlignment, setCharacterAlignment] = useState('')
  const [characterBackground, setCharacterBackground] = useState('')
  const [characterDeity, setCharacterDeity] = useState('')
  const [characterTalentsSpells, setCharacterTalentsSpells] = useState('')
  const [characterBackstory, setCharacterBackstory] = useState('')
  const [characterPortraitUrl, setCharacterPortraitUrl] = useState('')

  const [npcs, setNpcs] = useState<Npc[]>([])
  const [npcsLoading, setNpcsLoading] = useState(false)
  const [showNpc, setShowNpc] = useState(false)
  const [editingNpc, setEditingNpc] = useState<Npc | null>(null)
  const [npcName, setNpcName] = useState('')
  const [npcRole, setNpcRole] = useState('')
  const [npcMaxSlots, setNpcMaxSlots] = useState(10)

  const [storyCharacters, setStoryCharacters] = useState<StoryCharacter[]>([])
  const [storyCharactersLoading, setStoryCharactersLoading] = useState(false)
  const [showStoryCharacter, setShowStoryCharacter] = useState(false)
  const [editingStoryCharacter, setEditingStoryCharacter] = useState<StoryCharacter | null>(null)
  const [storyCharacterName, setStoryCharacterName] = useState('')
  const [storyCharacterLocation, setStoryCharacterLocation] = useState('')
  const [storyCharacterMeetingTime, setStoryCharacterMeetingTime] = useState('')
  const [storyCharacterCircumstances, setStoryCharacterCircumstances] = useState('')
  const [storyCharacterQuest, setStoryCharacterQuest] = useState('')
  const [storyCharacterFaction, setStoryCharacterFaction] = useState('')
  const [storyCharacterGroupMode, setStoryCharacterGroupMode] = useState<'alphabetical' | 'location' | 'quest' | 'time' | 'faction'>('alphabetical')

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
  const [editingCatalogItem, setEditingCatalogItem] = useState<CatalogItem | null>(null)
  const [catalogName, setCatalogName] = useState('')
  const [catalogSlotsPerUnit, setCatalogSlotsPerUnit] = useState(1)
  const [catalogSlotGroupSize, setCatalogSlotGroupSize] = useState(1)
  const [catalogFreeQuantity, setCatalogFreeQuantity] = useState(0)
  const [catalogCategory, setCatalogCategory] = useState<CatalogItemCategory>('normal')
  const [catalogLightMinutes, setCatalogLightMinutes] = useState(60)
  const [catalogWeaponDamage, setCatalogWeaponDamage] = useState('')
  const [catalogWeaponRange, setCatalogWeaponRange] = useState('')
  const [catalogWeaponProperties, setCatalogWeaponProperties] = useState('')
  const [catalogHandsRequired, setCatalogHandsRequired] = useState<1 | 2>(1)
  const [catalogArmorClass, setCatalogArmorClass] = useState('')
  const [catalogArmorProperties, setCatalogArmorProperties] = useState('')
  const [catalogIsMagical, setCatalogIsMagical] = useState(false)
  const [catalogIsQuestItem, setCatalogIsQuestItem] = useState(false)
  const [catalogMagicDescription, setCatalogMagicDescription] = useState('')
  const [catalogDescription, setCatalogDescription] = useState('')
  const [catalogContainerContent, setCatalogContainerContent] = useState('')
  const [catalogContainerFill, setCatalogContainerFill] = useState(0)
  const [fillingContainerItem, setFillingContainerItem] = useState<CharacterItem | null>(null)
  const [catalogMaxUses, setCatalogMaxUses] = useState(0)
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

  const [bastions, setBastions] = useState<Bastion[]>([])
  const [bastionUpgrades, setBastionUpgrades] = useState<BastionUpgrade[]>([])
  const [bastionsLoading, setBastionsLoading] = useState(false)
  const [showBastion, setShowBastion] = useState(false)
  const [bastionName, setBastionName] = useState('')
  const [bastionOwnerId, setBastionOwnerId] = useState('')
  const [bastionTypeId, setBastionTypeId] = useState<BastionTypeId>('house')
  const [showBastionHp, setShowBastionHp] = useState(false)
  const [editingBastionHp, setEditingBastionHp] = useState<Bastion | null>(null)
  const [bastionHpValue, setBastionHpValue] = useState(0)
  const [showBastionRepair, setShowBastionRepair] = useState(false)
  const [repairingBastion, setRepairingBastion] = useState<Bastion | null>(null)
  const [bastionRepairHp, setBastionRepairHp] = useState(1)
  const [showBastionUpgrade, setShowBastionUpgrade] = useState(false)
  const [upgradingBastion, setUpgradingBastion] = useState<Bastion | null>(null)
  const [bastionUpgradeId, setBastionUpgradeId] = useState('')

  const [bastionItems, setBastionItems] = useState<BastionItem[]>([])
  const [bastionItemsLoading, setBastionItemsLoading] = useState(false)

  const [showBuyItem, setShowBuyItem] = useState(false)
  const [buyOwnerType, setBuyOwnerType] = useState<InventoryOwnerType>('character')
  const [buyOwnerId, setBuyOwnerId] = useState('')
  const [buyCatalogItemId, setBuyCatalogItemId] = useState('')
  const [buyQuantity, setBuyQuantity] = useState(1)
  const [buyCharacterId, setBuyCharacterId] = useState('')
  const [buyGp, setBuyGp] = useState(0)
  const [buySp, setBuySp] = useState(0)
  const [buyCp, setBuyCp] = useState(0)
  const [buyContainerContent, setBuyContainerContent] = useState('')
  const [buyContainerFill, setBuyContainerFill] = useState(0)
  const [buyingItem, setBuyingItem] = useState(false)

  const [showSellItem, setShowSellItem] = useState(false)
  const [sellOwnerType, setSellOwnerType] = useState<InventoryOwnerType>('character')
  const [sellItemId, setSellItemId] = useState('')
  const [sellItemName, setSellItemName] = useState('')
  const [sellMaxQuantity, setSellMaxQuantity] = useState(1)
  const [sellQuantity, setSellQuantity] = useState(1)
  const [sellCharacterId, setSellCharacterId] = useState('')
  const [sellGp, setSellGp] = useState(0)
  const [sellSp, setSellSp] = useState(0)
  const [sellCp, setSellCp] = useState(0)
  const [sellingItem, setSellingItem] = useState(false)
  const [showCharacterShop, setShowCharacterShop] = useState(false)
  const [showShopSellPicker, setShowShopSellPicker] = useState(false)
  const [shopCharacterId, setShopCharacterId] = useState('')

  const [showTransferItem, setShowTransferItem] = useState(false)
  const [transferFromType, setTransferFromType] = useState<InventoryOwnerType>('character')
  const [transferFromOwnerId, setTransferFromOwnerId] = useState('')
  const [transferItemId, setTransferItemId] = useState('')
  const [transferItemName, setTransferItemName] = useState('')
  const [transferMaxQuantity, setTransferMaxQuantity] = useState(1)
  const [transferQuantity, setTransferQuantity] = useState(1)
  const [transferToKey, setTransferToKey] = useState('')
  const [transferringItem, setTransferringItem] = useState(false)

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

  function updateChronicleMention(value: string, cursor: number) {
    setChronicleContent(value)
    const before = value.slice(0, cursor)
    const match = before.match(/(?:^|\s)@([^@\n]*)$/)
    if (!match) {
      setChronicleMentionQuery(null)
      setChronicleMentionStart(null)
      return
    }
    const query = match[1]
    const start = cursor - query.length - 1
    setChronicleMentionQuery(query)
    setChronicleMentionStart(start)
    setChronicleMentionCursor(cursor)
  }

  function insertChronicleMention(name: string) {
    if (chronicleMentionStart === null) return
    const before = chronicleContent.slice(0, chronicleMentionStart)
    const after = chronicleContent.slice(chronicleMentionCursor)
    setChronicleContent(`${before}@${name} ${after}`)
    setChronicleMentionQuery(null)
    setChronicleMentionStart(null)
  }

  function renderChronicleText(text: string) {
    const names = [
      ...storyCharacters.map(character => ({
        kind: 'character' as const,
        name: character.name,
        value: character,
      })),
      ...mapMarkers.map(marker => ({
        kind: 'marker' as const,
        name: marker.name,
        value: marker,
      })),
    ].sort((a, b) => b.name.length - a.name.length)

    if (names.length === 0) return text

    const escaped = names.map(item =>
      item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    const regex = new RegExp(`@(${escaped.join('|')})(?=\\s|[.,!?;:)]|$)`, 'g')
    const parts: React.ReactNode[] = []
    let last = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      if (match.index > last) parts.push(text.slice(last, match.index))
      const found = names.find(item => item.name === match![1])
      if (found) {
        parts.push(
          <button
            key={`${found.kind}-${found.name}-${match.index}`}
            type="button"
            onClick={() => {
              if (found.kind === 'character') {
                setChronicleLinkedStoryCharacter(found.value as StoryCharacter)
              } else {
                setChronicleLinkedMarker(found.value as CampaignMapMarker)
              }
            }}
            style={{
              display: 'inline',
              padding: 0,
              border: 0,
              background: 'transparent',
              color: '#713f12',
              font: 'inherit',
              fontWeight: 800,
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: 3,
              cursor: 'pointer',
            }}
          >
            @{found.name}
          </button>
        )
      } else {
        parts.push(match[0])
      }
      last = regex.lastIndex
    }
    if (last < text.length) parts.push(text.slice(last))
    return parts
  }

  const refreshChronicle = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setChronicleEntries([])
      setSelectedChronicleId(null)
      return
    }

    setChronicleLoading(true)
    try {
      const entries = await loadChronicleEntries(activeId)
      setChronicleEntries(entries)
      setSelectedChronicleId(current =>
        current && entries.some(entry => entry.id === current)
          ? current
          : entries[entries.length - 1]?.id ?? null
      )
    } catch (e: any) {
      console.error('LOAD CHRONICLE ERROR:', e)
      setError(e?.message || e?.details || 'Nie udało się pobrać Kroniki.')
    } finally {
      setChronicleLoading(false)
    }
  }, [activeId, isCloudMode])

  function openNewChronicleEntry() {
    const latest = chronicleEntries[chronicleEntries.length - 1]
    setEditingChronicle(null)
    setChronicleTitle('')
    setChronicleSession(latest?.sessionNumber ?? 1)
    setChronicleDay(latest ? latest.worldDay + 1 : 1)
    setChronicleSeason(latest?.season ?? 'Wiosna')
    setChronicleContent('')
    setShowChronicleEditor(true)
  }

  function openEditChronicleEntry(entry: ChronicleEntry) {
    setEditingChronicle(entry)
    setChronicleTitle(entry.title)
    setChronicleSession(entry.sessionNumber)
    setChronicleDay(entry.worldDay)
    setChronicleSeason(entry.season)
    setChronicleContent(entry.content)
    setShowChronicleEditor(true)
  }

  async function saveChronicleEntry() {
    if (!activeId || !chronicleTitle.trim() || !chronicleContent.trim()) return
    try {
      let saved: ChronicleEntry | null = null
      if (editingChronicle) {
        saved = await updateChronicleEntry(editingChronicle.id, {
          title: chronicleTitle.trim(),
          sessionNumber: Math.max(1, chronicleSession),
          worldDay: Math.max(1, chronicleDay),
          season: chronicleSeason,
          content: chronicleContent.trim(),
        })
      } else {
        saved = await createChronicleEntry(activeId, {
          title: chronicleTitle.trim(),
          sessionNumber: Math.max(1, chronicleSession),
          worldDay: Math.max(1, chronicleDay),
          season: chronicleSeason,
          content: chronicleContent.trim(),
        })
      }
      await refreshChronicle()
      if (saved) setSelectedChronicleId(saved.id)
      setShowChronicleEditor(false)
      setEditingChronicle(null)
      setError(null)
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zapisać wpisu Kroniki.')
    }
  }

  async function removeChronicleEntry(entry: ChronicleEntry) {
    try {
      await deleteChronicleEntry(entry.id)
      await refreshChronicle()
      setShowChronicleEditor(false)
      setEditingChronicle(null)
      setError(null)
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się usunąć wpisu Kroniki.')
    }
  }

  const refreshMapMarkers = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setMapMarkers([])
      return
    }

    setMapMarkersLoading(true)
    try {
      setMapMarkers(await loadMapMarkers(activeId))
    } catch (e: any) {
      console.error('LOAD MAP MARKERS ERROR:', e)
      setError(e?.message || e?.details || 'Nie udało się pobrać markerów mapy.')
    } finally {
      setMapMarkersLoading(false)
    }
  }, [activeId, isCloudMode])

  const refreshMapHexes = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setMapRevealedHexes(new Set())
      return
    }

    setMapLoading(true)
    try {
      const ids = await loadRevealedCampaignHexes(activeId)
      setMapRevealedHexes(new Set(ids))
    } catch (e: any) {
      console.error('LOAD MAP HEXES ERROR:', e)
      setError(e?.message || e?.details || 'Nie udało się pobrać stanu mapy.')
    } finally {
      setMapLoading(false)
    }
  }, [activeId, isCloudMode])

  const refreshTreasure = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setTreasureItems([])
      return
    }
    setTreasureLoading(true)
    try {
      setTreasureItems(await loadTreasureItems(activeId))
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się pobrać Skrzyni ze skarbami.')
    } finally {
      setTreasureLoading(false)
    }
  }, [activeId, isCloudMode])

  const refreshCemetery = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setCharacterMemorials([])
      return
    }
    setCemeteryLoading(true)
    try {
      setCharacterMemorials(await loadCharacterMemorials(activeId))
    } catch (e: any) {
      console.error('LOAD CEMETERY ERROR:', e)
      setError(e?.message || e?.details || 'Nie udało się pobrać Cmentarza.')
    } finally {
      setCemeteryLoading(false)
    }
  }, [activeId, isCloudMode])

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

  const refreshStoryCharacters = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setStoryCharacters([])
      return
    }

    setStoryCharactersLoading(true)
    try {
      setStoryCharacters(await loadStoryCharacters(activeId))
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się pobrać Postaci Fabularnych.')
    } finally {
      setStoryCharactersLoading(false)
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

  const refreshBastions = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setBastions([])
      setBastionUpgrades([])
      return
    }

    setBastionsLoading(true)
    try {
      const [nextBastions, nextUpgrades] = await Promise.all([
        loadBastions(activeId),
        loadBastionUpgrades(activeId),
      ])
      setBastions(nextBastions)
      setBastionUpgrades(nextUpgrades)
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się pobrać bastionów.')
    } finally {
      setBastionsLoading(false)
    }
  }, [activeId, isCloudMode])

  const refreshBastionItems = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setBastionItems([])
      return
    }

    setBastionItemsLoading(true)
    try {
      setBastionItems(await loadBastionItems(activeId))
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się pobrać ekwipunku bastionów.')
    } finally {
      setBastionItemsLoading(false)
    }
  }, [activeId, isCloudMode])

  const refreshHistory = useCallback(async () => {
    if (!activeId || !isCloudMode) {
      setHistory([])
      return
    }

    setHistoryLoading(true)
    try {
      setHistory(await loadCampaignHistory(activeId))
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się pobrać historii operacji.')
    } finally {
      setHistoryLoading(false)
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaign_history',
          filter: `campaign_id=eq.${activeId}`,
        },
        payload => {
          const row = payload.new as any
          const updated: HistoryEntry = {
            id: row.id,
            campaignId: row.campaign_id,
            eventType: row.event_type as HistoryEventType,
            message: row.message,
            createdBy: row.created_by ?? null,
            createdAt: row.created_at,
            undoPayload: row.undo_payload ?? null,
            undoneAt: row.undone_at ?? null,
            undoneBy: row.undone_by ?? null,
          }

          setHistory(current =>
            current.map(entry =>
              entry.id === updated.id ? updated : entry
            )
          )
        }
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, refreshCampaigns])

  useEffect(() => {
    refreshChronicle()
  }, [refreshChronicle])

  useEffect(() => {
    if (!supabase || !session || !activeId) return
    const sb = supabase
    const channel = sb
      .channel(`campaign-chronicle-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_chronicle',
          filter: `campaign_id=eq.${activeId}`,
        },
        refreshChronicle
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshChronicle])

  useEffect(() => {
    refreshMapHexes()
  }, [refreshMapHexes])

  useEffect(() => {
    refreshMapMarkers()
  }, [refreshMapMarkers])

  useEffect(() => {
    refreshTreasure()
  }, [refreshTreasure])

  useEffect(() => {
    if (!supabase || !session || !activeId) return
    const sb = supabase
    const channel = sb
      .channel(`campaign-treasure-${activeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaign_treasure_items',
        filter: `campaign_id=eq.${activeId}`,
      }, refreshTreasure)
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [session, activeId, refreshTreasure])

  useEffect(() => {
    refreshCemetery()
  }, [refreshCemetery])

  useEffect(() => {
    if (!supabase || !session || !activeId) return
    const sb = supabase
    const channel = sb
      .channel(`campaign-cemetery-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_memorials',
          filter: `campaign_id=eq.${activeId}`,
        },
        refreshCemetery
      )
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [session, activeId, refreshCemetery])

  useEffect(() => {
    refreshCharacters()
  }, [refreshCharacters])

  useEffect(() => {
    if (
      selectedCharacterId &&
      !characters.some(character => character.id === selectedCharacterId)
    ) {
      setSelectedCharacterId(null)
    }
  }, [characters, selectedCharacterId])

  useEffect(() => {
    setSelectedCharacterId(null)
  }, [activeId])

  useEffect(() => {
    refreshNpcs()
  }, [refreshNpcs])

  useEffect(() => {
    refreshStoryCharacters()
  }, [refreshStoryCharacters])

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
    refreshBastions()
  }, [refreshBastions])

  useEffect(() => {
    refreshBastionItems()
  }, [refreshBastionItems])

  useEffect(() => {
    refreshHistory()
  }, [refreshHistory])

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
      .channel(`story-characters-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'story_characters',
          filter: `campaign_id=eq.${activeId}`,
        },
        refreshStoryCharacters
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshStoryCharacters])

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
      .channel(`bastions-${activeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bastions', filter: `campaign_id=eq.${activeId}` },
        refreshBastions
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bastion_upgrades' },
        refreshBastions
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshBastions])

  useEffect(() => {
    if (!supabase || !session || !activeId) return
    const sb = supabase

    const channel = sb
      .channel(`bastion-items-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bastion_items',
          filter: `campaign_id=eq.${activeId}`,
        },
        refreshBastionItems
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshBastionItems])





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


  useEffect(() => {
    if (!supabase || !session || !activeId) return

    const sb = supabase
    const channel = sb
      .channel(`campaign-map-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_map_hexes',
          filter: `campaign_id=eq.${activeId}`,
        },
        refreshMapHexes
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshMapHexes])

  useEffect(() => {
    if (!supabase || !session || !activeId) return

    const sb = supabase
    const channel = sb
      .channel(`campaign-map-markers-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_map_markers',
          filter: `campaign_id=eq.${activeId}`,
        },
        refreshMapMarkers
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId, refreshMapMarkers])

  const active =
    campaigns.find(c => c.id === activeId) ??
    campaigns[0]

  const canManageMap = mapGmUnlocked

  async function toggleCampaignHex(id: string) {
    if (!activeId || !canManageMap || mapLoading) return

    const wasRevealed = mapRevealedHexes.has(id)

    setSelectedHexId(id)
    setMapRevealedHexes(current => {
      const next = new Set(current)
      if (wasRevealed) next.delete(id)
      else next.add(id)
      return next
    })

    try {
      if (wasRevealed) await hideCampaignHex(activeId, id)
      else await revealCampaignHex(activeId, id)
      setError(null)
    } catch (e: any) {
      // rollback optimistic UI
      setMapRevealedHexes(current => {
        const next = new Set(current)
        if (wasRevealed) next.add(id)
        else next.delete(id)
        return next
      })
      setError(
        e?.message ||
          e?.details ||
          'Nie udało się zapisać zmiany heksa.'
      )
    }
  }

  const mapMarkerDefinitions: Record<MapMarkerType, { icon: string; label: string }> = {
    location: { icon: '📍', label: 'Lokacja' },
    settlement: { icon: '🏘️', label: 'Osada' },
    danger: { icon: '⚔️', label: 'Niebezpieczeństwo' },
    treasure: { icon: '💰', label: 'Skarb' },
    quest: { icon: '❗', label: 'Zadanie' },
  }

  function openNewMapMarker(hexId: string) {
    setEditingMapMarker(null)
    setMapMarkerHexId(hexId)
    setMapMarkerType('location')
    setMapMarkerName('')
    setMapMarkerNote('')
    setMapMarkerHexAction('keep')
    setShowMapMarker(true)
  }

  function openEditMapMarker(marker: CampaignMapMarker) {
    setEditingMapMarker(marker)
    setMapMarkerHexId(marker.hexId)
    setMapMarkerType(marker.markerType)
    setMapMarkerName(marker.name)
    setMapMarkerNote(marker.note ?? '')
    setMapMarkerHexAction('keep')
    setShowMapMarker(true)
  }

  async function saveMapMarker() {
    if (!activeId || !mapMarkerName.trim()) return
    try {
      if (editingMapMarker) {
        await updateMapMarker(editingMapMarker.id, {
          markerType: mapMarkerType,
          name: mapMarkerName.trim(),
          note: mapMarkerNote.trim(),
        })
      } else {
        await createMapMarker(activeId, {
          hexId: mapMarkerHexId,
          markerType: mapMarkerType,
          name: mapMarkerName.trim(),
          note: mapMarkerNote.trim(),
          isGm: mapGmUnlocked && mapGmMode,
        })
      }

      if (mapGmUnlocked && mapGmMode) {
        if (mapMarkerHexAction === 'reveal') {
          await revealCampaignHex(activeId, mapMarkerHexId)
        } else if (mapMarkerHexAction === 'hide') {
          await hideCampaignHex(activeId, mapMarkerHexId)
        }
      }

      await Promise.all([refreshMapMarkers(), refreshMapHexes()])
      setShowMapMarker(false)
      setEditingMapMarker(null)
      setError(null)
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zapisać markera.')
    }
  }

  async function removeMapMarker(marker: CampaignMapMarker) {
    try {
      await deleteMapMarker(marker.id)
      await refreshMapMarkers()
      setShowMapMarker(false)
      setEditingMapMarker(null)
      setError(null)
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się usunąć markera.')
    }
  }

  const chronicleMentionSuggestions = useMemo(() => {
    if (chronicleMentionQuery === null) return []
    const q = chronicleMentionQuery.trim().toLocaleLowerCase('pl')
    const suggestions = [
      ...storyCharacters.map(character => ({
        kind: 'character' as const,
        name: character.name,
        subtitle: character.location || 'Postać Fabularna',
      })),
      ...mapMarkers.map(marker => ({
        kind: 'marker' as const,
        name: marker.name,
        subtitle: `${marker.hexId} • miejsce`,
      })),
    ]
      .filter(item => !q || item.name.toLocaleLowerCase('pl').includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'pl'))
      .slice(0, 8)
    return suggestions
  }, [chronicleMentionQuery, storyCharacters, mapMarkers])

  const selectedChronicle =
    chronicleEntries.find(entry => entry.id === selectedChronicleId) ??
    chronicleEntries[chronicleEntries.length - 1] ??
    null

  const chronicleSeasons: ChronicleSeason[] = ['Wiosna', 'Lato', 'Jesień', 'Zima']

  const characterById = useMemo(
    () => new Map(characters.map(character => [character.id, character])),
    [characters]
  )

  const npcById = useMemo(
    () => new Map(npcs.map(npc => [npc.id, npc])),
    [npcs]
  )

  const animalById = useMemo(
    () => new Map(animals.map(animal => [animal.id, animal])),
    [animals]
  )

  const bastionById = useMemo(
    () => new Map(bastions.map(bastion => [bastion.id, bastion])),
    [bastions]
  )

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
    const max = activeCharacters.reduce(
      (sum, character) => sum + Math.max(10, character.strength) + Math.max(0, character.bonusSlots),
      0
    )

    const used = items
      .filter(item => !deadCharacterIds.has(item.characterId))
      .reduce((sum, item) => sum + slotUsageForItem(item), 0)

    return { used, max }
  }, [activeCharacters, deadCharacterIds, items, slotUsageForItem])

  const characterItemsByOwner = useMemo(() => {
    const grouped = new Map<string, CharacterItem[]>()
    for (const item of items) {
      const list = grouped.get(item.characterId)
      if (list) list.push(item)
      else grouped.set(item.characterId, [item])
    }
    return grouped
  }, [items])

  const characterSlotsByOwner = useMemo(() => {
    const totals = new Map<string, number>()
    for (const [characterId, ownerItems] of characterItemsByOwner) {
      totals.set(
        characterId,
        ownerItems.reduce((sum, item) => sum + slotUsageForItem(item), 0)
      )
    }
    return totals
  }, [characterItemsByOwner, slotUsageForItem])

  const usedSlotsForCharacter = useCallback(
    (characterId: string) => characterSlotsByOwner.get(characterId) ?? 0,
    [characterSlotsByOwner]
  )

  const itemsForCharacter = useCallback(
    (characterId: string) => characterItemsByOwner.get(characterId) ?? [],
    [characterItemsByOwner]
  )


  function formatSlotRule(item: {
    slotsPerUnit: number
    slotGroupSize: number
    freeQuantity: number
  }) {
    const slots = Number(item.slotsPerUnit)
    const group = Math.max(1, Number(item.slotGroupSize || 1))
    const free = Math.max(0, Number(item.freeQuantity || 0))
    const slotText = Number.isInteger(slots)
      ? String(slots)
      : String(Number(slots.toFixed(2)))

    if (group > 1 && free > 0) {
      return `${slotText} slot / ${group} szt. • pierwsze ${free} bez slotu`
    }
    if (group > 1) {
      return `${slotText} slot / ${group} szt.`
    }
    if (free > 0) {
      return `${slotText} slot./szt. • pierwsze ${free} bez slotu`
    }
    return `${slotText} slot./szt.`
  }

  const slotUsageForNpcItem = useCallback((item: NpcItem) => {
    const quantity = Math.max(0, item.quantity - (item.freeQuantity ?? 0))
    if (quantity <= 0) return 0
    const groupSize = Math.max(1, item.slotGroupSize ?? 1)
    return Math.ceil(quantity / groupSize) * item.slotsPerUnit
  }, [])

  const npcItemsByOwner = useMemo(() => {
    const grouped = new Map<string, NpcItem[]>()
    for (const item of npcItems) {
      const list = grouped.get(item.npcId)
      if (list) list.push(item)
      else grouped.set(item.npcId, [item])
    }
    return grouped
  }, [npcItems])

  const npcSlotsByOwner = useMemo(() => {
    const totals = new Map<string, number>()
    for (const [npcId, ownerItems] of npcItemsByOwner) {
      totals.set(
        npcId,
        ownerItems.reduce((sum, item) => sum + slotUsageForNpcItem(item), 0)
      )
    }
    return totals
  }, [npcItemsByOwner, slotUsageForNpcItem])

  const usedSlotsForNpc = useCallback(
    (npcId: string) => npcSlotsByOwner.get(npcId) ?? 0,
    [npcSlotsByOwner]
  )

  const itemsForNpc = useCallback(
    (npcId: string) => npcItemsByOwner.get(npcId) ?? [],
    [npcItemsByOwner]
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

  const animalItemsByOwner = useMemo(() => {
    const grouped = new Map<string, AnimalItem[]>()
    for (const item of animalItems) {
      const list = grouped.get(item.animalId)
      if (list) list.push(item)
      else grouped.set(item.animalId, [item])
    }
    return grouped
  }, [animalItems])

  const animalHasWagon = useCallback(
    (animalId: string) =>
      (animalItemsByOwner.get(animalId) ?? []).some(item =>
        isWagonName(item.name)
      ),
    [animalItemsByOwner, isWagonName]
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

  const animalSlotsByOwner = useMemo(() => {
    const totals = new Map<string, number>()
    for (const [animalId, ownerItems] of animalItemsByOwner) {
      totals.set(
        animalId,
        ownerItems.reduce((sum, item) => sum + slotUsageForAnimalItem(item), 0)
      )
    }
    return totals
  }, [animalItemsByOwner, slotUsageForAnimalItem])

  const usedSlotsForAnimal = useCallback(
    (animalId: string) => animalSlotsByOwner.get(animalId) ?? 0,
    [animalSlotsByOwner]
  )

  const itemsForAnimal = useCallback(
    (animalId: string) => animalItemsByOwner.get(animalId) ?? [],
    [animalItemsByOwner]
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

  const themedSelectStyle = {
    width: '100%',
    minHeight: 36,
    padding: '7px 34px 7px 10px',
    borderRadius: 6,
    border: '1px solid rgba(138, 101, 48, 0.72)',
    background: 'rgba(18, 16, 13, 0.96)',
    color: '#e6cf9c',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.55)',
    outline: 'none',
    fontWeight: 700,
  } as const

  const inventoryHighlightStyle = useCallback(
    (category: ItemCategory, isMagical = false, isQuestItem = false) => {
      if (isQuestItem) {
        return {
          border: '1px solid rgba(210, 122, 39, 0.92)',
          borderRadius: 8,
          padding: '10px 12px',
          alignItems: 'center',
          background:
            'linear-gradient(135deg, rgba(190, 94, 24, 0.28), rgba(103, 57, 24, 0.18))',
          boxShadow:
            'inset 0 0 0 1px rgba(255, 174, 83, 0.13), 0 0 12px rgba(188, 91, 24, 0.08)',
        }
      }

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

      return {
        borderTop: '1px solid rgba(180, 135, 60, 0.25)',
        paddingTop: 8,
        alignItems: 'center',
      }
    },
    []
  )

  const catalogById = useMemo(
    () => new Map(catalog.map(entry => [entry.id, entry])),
    [catalog]
  )

  const catalogEntryForItem = useCallback(
    (catalogItemId: string | null) =>
      catalogItemId ? catalogById.get(catalogItemId) ?? null : null,
    [catalogById]
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

  const descriptionForItem = useCallback(
    (catalogItemId: string | null) =>
      catalogEntryForItem(catalogItemId)?.description ?? null,
    [catalogEntryForItem]
  )

  const containerContentForItem = useCallback(
    (catalogItemId: string | null) =>
      catalogEntryForItem(catalogItemId)?.containerContent ?? null,
    [catalogEntryForItem]
  )

  function inventoryDisplayName(item: {
    name: string
    category: ItemCategory
    catalogItemId: string | null
    usesRemaining?: number
  }) {
    if (item.category !== 'container') return item.name

    const entry = catalogEntryForItem(item.catalogItemId)
    const content = (entry?.containerContent ?? '').trim()
    const base = containerBaseName(
      entry?.name ?? item.name,
      content
    )
    const fill = Math.max(0, Number(item.usesRemaining ?? 0))

    return fill > 0 && content
      ? `${base} - ${content}`
      : base
  }

  const shopCatalogOptions = useMemo(() => {
    const regular = catalog.filter(
      entry => entry.category !== 'container'
    )

    const containers = new Map<string, CatalogItem>()
    for (const entry of catalog.filter(
      candidate => candidate.category === 'container'
    )) {
      const base = containerBaseName(
        entry.name,
        entry.containerContent
      )
      const key = base.trim().toLowerCase()
      const current = containers.get(key)

      if (
        !current ||
        (!(entry.containerContent ?? '').trim() &&
          (current.containerContent ?? '').trim())
      ) {
        containers.set(key, entry)
      }
    }

    return [...regular, ...containers.values()].sort(
      (a, b) =>
        (
          a.category === 'container'
            ? containerBaseName(a.name, a.containerContent)
            : a.name
        ).localeCompare(
          b.category === 'container'
            ? containerBaseName(b.name, b.containerContent)
            : b.name,
          'pl'
        )
    )
  }, [catalog])

  function openInventoryItemDescription(item: {
    name: string
    catalogItemId: string | null
  }) {
    const entry = catalogEntryForItem(item.catalogItemId)
    if (!entry) return

    const parts: string[] = []
    if ((entry.description ?? '').trim()) {
      parts.push(entry.description!.trim())
    }
    if (
      entry.isMagical &&
      (entry.magicDescription ?? '').trim()
    ) {
      parts.push(`MAGICZNE WŁAŚCIWOŚCI\n${entry.magicDescription!.trim()}`)
    }

    if (!parts.length) return
    setDescriptionItem({
      name: item.name,
      description: parts.join('\n\n'),
    })
  }

  const isUnidentifiedMagicalInventoryItem = useCallback(
    (catalogItemId: string | null) => {
      const entry = catalogEntryForItem(catalogItemId)
      return Boolean(
        entry?.isMagical &&
          !(entry.magicDescription ?? '').trim()
      )
    },
    [catalogEntryForItem]
  )

  function identifyMagicalInventoryItem(
    item: { catalogItemId: string | null }
  ) {
    if (!item.catalogItemId) return

    const entry = catalogEntryForItem(item.catalogItemId)
    if (!entry) {
      setError('Nie znaleziono tego przedmiotu w Bibliotece.')
      return
    }

    openEditCatalogItem(entry)
  }

  function openMagicItemDescription(
    item: { name: string; catalogItemId: string | null }
  ) {
    const description = magicDescriptionForItem(item.catalogItemId)
    if (!description) return

    setMagicDescriptionItem({
      name: item.name,
      description,
    })
  }

  const isQuestInventoryItem = useCallback(
    (catalogItemId: string | null) =>
      Boolean(catalogEntryForItem(catalogItemId)?.isQuestItem),
    [catalogEntryForItem]
  )

  function isCoinInventoryItem(
    item: { name: string; catalogItemId: string | null }
  ) {
    const catalogName = catalogEntryForItem(item.catalogItemId)?.name ?? ''
    const itemKey = normalizeInventoryName(item.name)
    const catalogKey = normalizeInventoryName(catalogName)

    return (
      ['coin', 'coins'].includes(itemKey) ||
      ['coin', 'coins'].includes(catalogKey)
    )
  }

  function sortInventoryForDisplay<
    T extends {
      name: string
      catalogItemId: string | null
      isEquipped?: boolean
    }
  >(inventory: T[]): T[] {
    return [...inventory].sort((a, b) => {
      const equippedOrder = Number(Boolean(b.isEquipped)) - Number(Boolean(a.isEquipped))
      if (equippedOrder !== 0) return equippedOrder

      const aCoin = isCoinInventoryItem(a) ? 1 : 0
      const bCoin = isCoinInventoryItem(b) ? 1 : 0
      if (aCoin !== bCoin) return aCoin - bCoin

      return a.name.localeCompare(b.name, 'pl')
    })
  }

  function inventoryCategoryMarker(item: {
    name: string
    catalogItemId: string | null
    category: ItemCategory
  }) {
    const commonStyle = {
      width: 21,
      height: 21,
      minWidth: 21,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 5,
      marginRight: 7,
      verticalAlign: 'middle',
    } as const

    if (isCoinInventoryItem(item)) {
      return (
        <span
          title="Coins"
          aria-label="Coins"
          style={{
            ...commonStyle,
            color: '#d8b35f',
            border: '1px solid rgba(188, 143, 55, 0.58)',
            background: 'rgba(117, 82, 27, 0.18)',
          }}
        >
          <Coins size={13} />
        </span>
      )
    }

    if (item.category === 'food') {
      return (
        <span
          title="Rations / żywność"
          aria-label="Rations / żywność"
          style={{
            ...commonStyle,
            color: '#87aa68',
            border: '1px solid rgba(105, 139, 78, 0.55)',
            background: 'rgba(65, 91, 49, 0.17)',
          }}
        >
          <Utensils size={13} />
        </span>
      )
    }

    if (item.category === 'light') {
      return (
        <span
          title="Źródło światła"
          aria-label="Źródło światła"
          style={{
            ...commonStyle,
            color: '#d6a846',
            border: '1px solid rgba(189, 137, 42, 0.58)',
            background: 'rgba(112, 76, 25, 0.17)',
          }}
        >
          <Flame size={13} />
        </span>
      )
    }

    return null
  }

  const charactersWealth = useMemo(
    () => characters.reduce((sum, character) => sum + character.gold, 0),
    [characters]
  )

  const npcCoins = useMemo(
    () =>
      npcItems
        .filter(item => isCoinInventoryItem(item))
        .reduce((sum, item) => sum + item.quantity, 0),
    [npcItems, catalog]
  )

  const animalCoins = useMemo(
    () =>
      animalItems
        .filter(item => isCoinInventoryItem(item))
        .reduce((sum, item) => sum + item.quantity, 0),
    [animalItems, catalog]
  )

  const bastionCoins = useMemo(
    () =>
      bastionItems
        .filter(item => isCoinInventoryItem(item))
        .reduce((sum, item) => sum + item.quantity, 0),
    [bastionItems, catalog]
  )

  const expeditionGold = charactersWealth + npcCoins + animalCoins
  const totalWealth = expeditionGold + bastionCoins


  const inventorySummary = useMemo(() => {
    type SummaryOwner = {
      key: string
      owner: string
      ownerType: 'Postać' | 'NPC' | 'Zwierzę' | 'Bastion'
      quantity: number
    }

    type SummaryGroup = {
      key: string
      name: string
      category: ItemCategory
      catalogItemId: string | null
      total: number
      owners: SummaryOwner[]
    }

    const groups = new Map<string, SummaryGroup>()

    const add = (
      name: string,
      quantity: number,
      category: ItemCategory,
      catalogItemId: string | null,
      owner: string,
      ownerType: SummaryOwner['ownerType'],
      ownerKey: string
    ) => {
      if (quantity <= 0) return
      const itemKey = `${normalizeInventoryName(name)}::${catalogItemId ?? ''}`
      let group = groups.get(itemKey)
      if (!group) {
        group = {
          key: itemKey,
          name,
          category,
          catalogItemId,
          total: 0,
          owners: [],
        }
        groups.set(itemKey, group)
      }
      group.total += quantity

      const existing = group.owners.find(entry => entry.key === ownerKey)
      if (existing) existing.quantity += quantity
      else group.owners.push({ key: ownerKey, owner, ownerType, quantity })
    }

    items
      .filter(item => !deadCharacterIds.has(item.characterId))
      .forEach(item => {
        const owner = activeCharacters.find(character => character.id === item.characterId)
        add(item.name, item.quantity, item.category, item.catalogItemId,
          owner?.name ?? 'Nieznana postać', 'Postać', `character:${item.characterId}`)
      })

    npcItems.forEach(item => {
      const owner = npcs.find(npc => npc.id === item.npcId)
      add(item.name, item.quantity, item.category, item.catalogItemId,
        owner?.name ?? 'Nieznany NPC', 'NPC', `npc:${item.npcId}`)
    })

    animalItems.forEach(item => {
      const owner = animals.find(animal => animal.id === item.animalId)
      add(item.name, item.quantity, item.category, item.catalogItemId,
        owner?.name ?? 'Nieznane zwierzę', 'Zwierzę', `animal:${item.animalId}`)
    })

    bastionItems.forEach(item => {
      const owner = bastions.find(bastion => bastion.id === item.bastionId)
      add(item.name, item.quantity, item.category, item.catalogItemId,
        owner?.name ?? 'Nieznany bastion', 'Bastion', `bastion:${item.bastionId}`)
    })

    return Array.from(groups.values())
      .map(group => ({
        ...group,
        owners: group.owners.sort((a, b) =>
          a.owner.localeCompare(b.owner, 'pl', { sensitivity: 'base' })
        ),
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' })
      )
  }, [items, activeCharacters, deadCharacterIds, npcItems, npcs, animalItems, animals, bastionItems, bastions])

  const questItemSummary = useMemo(
    () =>
      inventorySummary.filter(group =>
        isQuestInventoryItem(group.catalogItemId)
      ),
    [inventorySummary, isQuestInventoryItem]
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


  const expeditionWarnings = useMemo(() => {
    const result: Array<{ key: string; severity: 'warning' | 'danger'; text: string }> = []

    for (const character of characters) {
      const used = usedSlotsForCharacter(character.id)
      const max =
        Math.max(10, character.strength) +
        Math.max(0, character.bonusSlots)
      const rations = characterRationCounts.get(character.id) ?? 0
      const qpCount = items.filter(item => item.characterId === character.id && item.isQuickpull).length
      const qpLimit = Math.max(0, statModifier(character.dexterity))

      if (rations < 1) {
        result.push({
          key: `cf-${character.id}`,
          severity: 'danger',
          text: `${character.name}: brak racji.`,
        })
      }

      if (used >= max) {
        result.push({
          key: `cs-${character.id}`,
          severity: used > max ? 'danger' : 'warning',
          text: `${character.name}: ekwipunek ${Number(used.toFixed(2))}/${max} slotów.`,
        })
      }

      if (qpCount > qpLimit) {
        result.push({
          key: `cq-${character.id}`,
          severity: 'danger',
          text: `${character.name}: Quickpull ${qpCount}/${qpLimit} — przekroczony limit DEX.`,
        })
      }
    }

    for (const npc of npcs) {
      const used = usedSlotsForNpc(npc.id)
      const rations = npcRationCounts.get(npc.id) ?? 0

      if (rations < 1) {
        result.push({
          key: `nf-${npc.id}`,
          severity: 'danger',
          text: `${npc.name} (NPC): brak racji.`,
        })
      }

      if (used >= npc.maxSlots) {
        result.push({
          key: `ns-${npc.id}`,
          severity: used > npc.maxSlots ? 'danger' : 'warning',
          text: `${npc.name} (NPC): ekwipunek ${Number(used.toFixed(2))}/${npc.maxSlots} slotów.`,
        })
      }
    }

    return result
  }, [
    characters,
    npcs,
    items,
    characterRationCounts,
    npcRationCounts,
    usedSlotsForCharacter,
    usedSlotsForNpc,
  ])


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
      ...activeCharacters.map(character => ({
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
      activeCharacters,
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

    const undoBefore = await captureUndoScopes([
      from.type === 'character'
        ? { table: 'character_items', filters: { character_id: from.id } }
        : { table: 'npc_items', filters: { npc_id: from.id } },
      to.type === 'character'
        ? { table: 'character_items', filters: { character_id: to.id } }
        : { table: 'npc_items', filters: { npc_id: to.id } },
    ])

    setTransferringRation(true)

    try {
      await transferMemberRation(activeId, from.type, from.id, to.type, to.id)
      await Promise.all([
        refreshItems(),
        refreshCharacters(),
        refreshNpcItems(),
        refreshNpcs(),
      ])
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(
        `${from.name} → ${to.name}: przekazano 1 × Rations.`,
        'food',
        undoPayload
      )
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

    const undoBefore = await captureUndoScopes([
      { table: 'animals', filters: { campaign_id: activeId } },
      { table: 'animal_items', filters: { campaign_id: activeId } },
    ])

    setFeedingAnimals(true)

    try {
      const result = await feedAnimals(activeId, animalFeedMethod)
      await Promise.all([refreshAnimalItems(), refreshAnimals()])

      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(
        result.method === 'pasture'
          ? `Nakarmiono ${result.animalsFed} zwierząt na pastwisku — nie zużyto Rations.`
          : `Nakarmiono ${result.animalsFed} zwierząt — zużyto ${result.animalsFed} × Rations.`,
        'food',
        undoPayload
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

    if (!activeCharacters.length && !npcs.length) {
      setError('W kampanii nie ma żywych członków ekspedycji do nakarmienia.')
      return
    }

    if (deadCharacterIds.size > 0) {
      setError(
        'Automatyczne karmienie całej ekspedycji jest zablokowane przy postaciach na Cmentarzu, aby nie zużyć ich racji. Racje żywych możesz przekazywać z panelu racji.'
      )
      return
    }

    const undoBefore = await captureUndoScopes([
      { table: 'characters', filters: { campaign_id: activeId } },
      { table: 'npcs', filters: { campaign_id: activeId } },
      { table: 'character_items', filters: { campaign_id: activeId } },
      { table: 'npc_items', filters: { campaign_id: activeId } },
    ])

    setFeedingExpedition(true)

    try {
      const result = await feedExpedition(activeId)
      await Promise.all([
        refreshItems(),
        refreshCharacters(),
        refreshNpcItems(),
        refreshNpcs(),
      ])
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(
        `Nakarmiono ekspedycję — ${result.membersFed} ${
          result.membersFed === 1 ? 'członek' : 'członków'
        }, zużyto ${result.membersFed} × Rations.`,
        'food',
        undoPayload
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

  async function handleAddTreasure() {
    if (!activeId || !treasureName.trim()) return
    try {
      await createTreasureItem({
        campaignId: activeId,
        name: treasureName.trim(),
        quantity: Math.max(1, treasureQuantity),
        category: treasureCategory,
      })
      setTreasureName('')
      setTreasureQuantity(1)
      setTreasureCategory('normal')
      setShowTreasureAdd(false)
      await refreshTreasure()
      flash('Dodano łup do Skrzyni ze skarbami.', 'inventory')
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się dodać łupu.')
    }
  }

  async function handleGiveTreasure() {
    if (!activeId || !treasureTransferItem || !treasureRecipientId) return
    const recipient = activeCharacters.find(c => c.id === treasureRecipientId)
    if (!recipient) {
      setError('Wybierz żywą postać.')
      return
    }
    try {
      await createItem({
        campaignId: activeId,
        characterId: recipient.id,
        name: treasureTransferItem.name,
        quantity: treasureTransferItem.quantity,
        slotsPerUnit: 1,
        slotGroupSize: 1,
        freeQuantity: 0,
        category: treasureTransferItem.category,
        lightMinutes: treasureTransferItem.category === 'light' ? 60 : 0,
        catalogItemId: null,
        weaponDamage: null,
        weaponRange: null,
        weaponProperties: null,
        armorClass: null,
        armorProperties: null,
        maxUses: 0,
      })
      await deleteTreasureItem(treasureTransferItem.id)
      setTreasureTransferItem(null)
      setTreasureRecipientId('')
      await Promise.all([refreshTreasure(), refreshItems(), refreshCharacters()])
      flash(`Skrzynia → ${recipient.name}: przekazano ${treasureTransferItem.name}.`, 'inventory')
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się przekazać skarbu.')
    }
  }

  async function downloadCampaignBackup() {
    if (!activeId || !active || !supabase) return
    try {
      const { data, error } = await supabase.rpc('export_campaign_backup_v3', {
        p_campaign_id: activeId,
      })
      if (error) throw error

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shadowdark-kopia-zapasowa-${active.name.replace(/[^a-z0-9-_]+/gi, '-')}-${new Date().toISOString().slice(0,10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      flash('Utworzono kopię zapasową kampanii.', 'other')
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się utworzyć kopii zapasowej.')
    }
  }

  async function selectBackupRestoreFile(file: File | null) {
    setBackupRestoreFile(file)
    setBackupRestoreData(null)
    setBackupRestoreConfirm('')
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      if (
        parsed?.format !== 'shadowdark-manager-backup' ||
        parsed?.version !== 3 ||
        !parsed?.campaign?.id
      ) {
        throw new Error('To nie jest prawidłowa kopia zapasowa Shadowdark Manager.')
      }
      setBackupRestoreData(parsed)
      setError(null)
    } catch (e: any) {
      setBackupRestoreFile(null)
      setError(e?.message || 'Nie udało się odczytać pliku kopii zapasowej.')
    }
  }

  async function restoreCampaignBackup() {
    if (!supabase || !activeId || !backupRestoreData) return
    if (backupRestoreConfirm.trim().toUpperCase() !== 'PRZYWRÓĆ') {
      setError('Wpisz PRZYWRÓĆ, aby potwierdzić odtworzenie kampanii.')
      return
    }
    if (backupRestoreData.campaign.id !== activeId) {
      setError(
        `Ta kopia dotyczy kampanii „${backupRestoreData.campaign.name ?? backupRestoreData.campaign.id}”. ` +
        'Można ją wczytać tylko do tej samej kampanii.'
      )
      return
    }

    setBackupRestoreBusy(true)
    try {
      const { error } = await supabase.rpc('restore_campaign_backup_v3', {
        p_campaign_id: activeId,
        p_backup: backupRestoreData,
      })
      if (error) throw error

      await Promise.all([
        refreshCampaigns(),
        refreshCharacters(),
        refreshItems(),
        refreshNpcs(),
        refreshNpcItems(),
        refreshStoryCharacters(),
        refreshAnimals(),
        refreshAnimalItems(),
        refreshBastions(),
        refreshBastionItems(),
        refreshCatalog(),
        refreshChronicle(),
        refreshMapMarkers(),
        refreshMapHexes(),
        refreshCemetery(),
        refreshTreasure(),
      ])

      setBackupRestoreFile(null)
      setBackupRestoreData(null)
      setBackupRestoreConfirm('')
      setShowBackupMenu(false)
      setSelectedCharacterId(null)
      flash('Kopia zapasowa została przywrócona.', 'other')
    } catch (e: any) {
      console.error('RESTORE BACKUP ERROR:', e)
      setError(e?.message || e?.details || 'Nie udało się przywrócić kopii zapasowej.')
    } finally {
      setBackupRestoreBusy(false)
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
            !deadCharacterIds.has(item.characterId) &&
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
            activeCharacters.find(character => character.id === item.characterId)?.name ??
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
    [items, activeCharacters, deadCharacterIds, npcItems, npcs]
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
      ...activeCharacters.map(character => ({
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
    [activeCharacters, npcs]
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
    if (lightState?.status !== 'running') return

    let intervalId: number | null = null

    const stop = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId)
        intervalId = null
      }
    }

    const start = () => {
      stop()
      setLightNow(Date.now())

      if (document.visibilityState === 'visible') {
        intervalId = window.setInterval(
          () => setLightNow(Date.now()),
          1000
        )
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') start()
      else stop()
    }

    start()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', handleVisibility)
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

  function lightUndoScopeSpecs(): UndoScopeSpec[] {
    if (!activeId) return []
    return [
      {
        table: 'campaign_light',
        filters: { campaign_id: activeId },
        keyColumns: ['campaign_id'],
      },
      { table: 'character_items', filters: { campaign_id: activeId } },
      { table: 'npc_items', filters: { campaign_id: activeId } },
      { table: 'characters', filters: { campaign_id: activeId } },
      { table: 'npcs', filters: { campaign_id: activeId } },
    ]
  }

  async function handleLightStartOrResume() {
    if (!activeId) return

    const undoBefore = await captureUndoScopes(lightUndoScopeSpecs())

    try {
      setLightLoading(true)

      if (lightState?.status === 'paused') {
        setLightState(await resumeCampaignLight(activeId))
        setLightNow(Date.now())
        const undoPayload = await finalizeUndoScopes(undoBefore)
        flash('Wznowiono licznik światła.', 'light', undoPayload)
        return
      }

      if (!selectedLightChoice) {
        setError('Wybierz członka ekspedycji i źródło światła z jego ekwipunku.')
        return
      }

      if (selectedLightChoice.memberType === 'character') {
        const handConflict = canCharacterCarryActiveLight(
          selectedLightChoice.memberId
        )
        if (handConflict) {
          setError(handConflict)
          return
        }
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
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(
        `${selectedLightChoice?.memberName ?? 'Ekspedycja'} zapalił(a): ${selectedLightChoice?.itemName ?? 'źródło światła'}.`,
        'light',
        undoPayload
      )
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się uruchomić światła.')
    } finally {
      setLightLoading(false)
    }
  }

  async function handleLightPause() {
    if (!activeId || lightState?.status !== 'running') return

    const undoBefore = await captureUndoScopes(lightUndoScopeSpecs())

    try {
      setLightLoading(true)
      setLightState(await pauseCampaignLight(activeId))
      setLightNow(Date.now())
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash('Wstrzymano licznik światła.', 'light', undoPayload)
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zatrzymać licznika.')
    } finally {
      setLightLoading(false)
    }
  }

  async function handleLightExtinguish() {
    if (!activeId) return

    const undoBefore = await captureUndoScopes(lightUndoScopeSpecs())

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
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(
        `Zgaszono: ${lightSourceName} • niosący: ${lightCarrierName}.`,
        'light',
        undoPayload
      )
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

    if (target.type === 'character') {
      const handConflict = canCharacterCarryActiveLight(target.id)
      if (handConflict) {
        setError(handConflict)
        return
      }
    }

    const undoBefore = await captureUndoScopes(lightUndoScopeSpecs())

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
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(
        `${lightCarrierName} → ${target.name}: przekazano ${lightSourceName} bez zatrzymywania licznika.`,
        'light',
        undoPayload
      )
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


  useEffect(() => {
    if (!supabase || !session || !activeId) return
    const sb = supabase

    const channel = sb
      .channel(`history-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_history',
          filter: `campaign_id=eq.${activeId}`,
        },
        payload => {
          const row = payload.new as any
          const incoming: HistoryEntry = {
            id: row.id,
            campaignId: row.campaign_id,
            eventType: row.event_type as HistoryEventType,
            message: row.message,
            createdBy: row.created_by ?? null,
            createdAt: row.created_at,
            undoPayload: row.undo_payload ?? null,
            undoneAt: row.undone_at ?? null,
            undoneBy: row.undone_by ?? null,
          }

          setHistory(current => {
            if (current.some(entry => entry.id === incoming.id)) return current
            return [incoming, ...current].slice(0, 300)
          })
        }
      )
      .subscribe()

    return () => {
      sb.removeChannel(channel)
    }
  }, [session, activeId])


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

  function historyTypeForMessage(text: string): HistoryEventType {
    const value = text.toLowerCase()

    if (
      value.includes('zakup') ||
      value.includes('sprzedaż') ||
      value.includes('zapłacono') ||
      value.includes('otrzymano')
    ) return 'trade'

    if (
      value.includes('światł') ||
      value.includes('latarn') ||
      value.includes('pochodn')
    ) return 'light'

    if (
      value.includes('racj') ||
      value.includes('nakarm') ||
      value.includes('pastwisk')
    ) return 'food'

    if (
      value.includes('bastion') ||
      value.includes('vault') ||
      value.includes('ulepszenie') ||
      value.includes('naprawiono')
    ) return 'bastion'

    if (value.includes('zwierzę')) return 'animal'
    if (value.includes('npc')) return 'npc'
    if (value.includes('postać')) return 'character'
    if (value.includes('katalog') || value.includes('bibliotek')) return 'library'

    if (
      value.includes('przedmiot') ||
      value.includes('quickpull') ||
      value.includes('przeniesiono') ||
      value.includes('zużyto')
    ) return 'inventory'

    return 'other'
  }

  function shouldStoreHistory(text: string) {
    const value = text.toLowerCase()
    return !(
      value.includes('kod kampanii skopiowany') ||
      value.includes('dołączono do kampanii') ||
      value.includes('kampania została utworzona')
    )
  }

  async function recordOperation(
    text: string,
    type?: HistoryEventType,
    undoPayload: HistoryUndoPayload | null = null
  ) {
    if (!activeId || !isCloudMode || !shouldStoreHistory(text)) return

    try {
      await addCampaignHistory(
        activeId,
        type ?? historyTypeForMessage(text),
        text,
        undoPayload
      )
    } catch (e) {
      console.warn('HISTORY WRITE ERROR:', e)
    }
  }

  function flash(
    text: string,
    historyType?: HistoryEventType,
    undoPayload: HistoryUndoPayload | null = null
  ) {
    setMessage(text)

    void recordOperation(text, historyType, undoPayload)

    window.setTimeout(
      () => setMessage(null),
      3000
    )
  }

  function openNewCharacter() {
    setEditingCharacter(null)
    setCharacterName('')
    setCharacterStrength(10)
    setCharacterDexterity(10)
    setCharacterConstitution(10)
    setCharacterIntelligence(10)
    setCharacterWisdom(10)
    setCharacterCharisma(10)
    setCharacterGold(0)
    setCharacterMaxHp(1)
    setCharacterCurrentHp(1)
    setCharacterTemporaryHp(0)
    setCharacterBonusSlots(0)
    setCharacterAncestry('')
    setCharacterClassName('')
    setCharacterLevel(1)
    setCharacterXp(0)
    setCharacterXpNext(10)
    setCharacterTitle('')
    setCharacterAlignment('')
    setCharacterBackground('')
    setCharacterDeity('')
    setCharacterTalentsSpells('')
    setCharacterBackstory('')
    setCharacterPortraitUrl('')
    setShowCharacter(true)
  }

  function openEditCharacter(character: Character) {
    setEditingCharacter(character)
    setCharacterName(character.name)
    setCharacterStrength(character.strength)
    setCharacterDexterity(character.dexterity)
    setCharacterConstitution(character.constitution)
    setCharacterIntelligence(character.intelligence)
    setCharacterWisdom(character.wisdom)
    setCharacterCharisma(character.charisma)
    setCharacterGold(character.gold)
    setCharacterMaxHp(character.maxHp)
    setCharacterCurrentHp(character.currentHp)
    setCharacterTemporaryHp(character.temporaryHp)
    setCharacterBonusSlots(character.bonusSlots)
    setCharacterAncestry(character.ancestry)
    setCharacterClassName(character.className)
    setCharacterLevel(character.level)
    setCharacterXp(character.xp)
    setCharacterXpNext(character.xpNext)
    setCharacterTitle(character.title)
    setCharacterAlignment(character.alignment)
    setCharacterBackground(character.background)
    setCharacterDeity(character.deity)
    setCharacterTalentsSpells(character.talentsSpells)
    setCharacterBackstory(character.backstory)
    setCharacterPortraitUrl(character.portraitUrl)
    setShowCharacter(true)
  }

  function resetCharacterDraft() {
    if (editingCharacter) {
      setCharacterName(editingCharacter.name)
      setCharacterStrength(editingCharacter.strength)
      setCharacterDexterity(editingCharacter.dexterity)
      setCharacterConstitution(editingCharacter.constitution)
      setCharacterIntelligence(editingCharacter.intelligence)
      setCharacterWisdom(editingCharacter.wisdom)
      setCharacterCharisma(editingCharacter.charisma)
      setCharacterGold(editingCharacter.gold)
      setCharacterCurrentHp(editingCharacter.currentHp)
      setCharacterMaxHp(editingCharacter.maxHp)
      setCharacterTemporaryHp(editingCharacter.temporaryHp)
      setCharacterBonusSlots(editingCharacter.bonusSlots)
      setCharacterAncestry(editingCharacter.ancestry)
      setCharacterClassName(editingCharacter.className)
      setCharacterLevel(editingCharacter.level)
      setCharacterXp(editingCharacter.xp)
      setCharacterXpNext(editingCharacter.xpNext)
      setCharacterTitle(editingCharacter.title)
      setCharacterAlignment(editingCharacter.alignment)
      setCharacterBackground(editingCharacter.background)
      setCharacterDeity(editingCharacter.deity)
      setCharacterTalentsSpells(editingCharacter.talentsSpells)
      setCharacterBackstory(editingCharacter.backstory)
      setCharacterPortraitUrl(editingCharacter.portraitUrl)
      return
    }

    setCharacterName('')
    setCharacterStrength(10)
    setCharacterDexterity(10)
    setCharacterConstitution(10)
    setCharacterIntelligence(10)
    setCharacterWisdom(10)
    setCharacterCharisma(10)
    setCharacterGold(0)
    setCharacterCurrentHp(1)
    setCharacterMaxHp(1)
    setCharacterTemporaryHp(0)
    setCharacterBonusSlots(0)
    setCharacterAncestry('')
    setCharacterClassName('')
    setCharacterLevel(1)
    setCharacterXp(0)
    setCharacterXpNext(10)
    setCharacterTitle('')
    setCharacterAlignment('')
    setCharacterBackground('')
    setCharacterDeity('')
    setCharacterTalentsSpells('')
    setCharacterBackstory('')
    setCharacterPortraitUrl('')
  }

  function characterHistorySnapshot(character: Character) {
    return {
      name: character.name,
      strength: character.strength,
      dexterity: character.dexterity,
      constitution: character.constitution,
      intelligence: character.intelligence,
      wisdom: character.wisdom,
      charisma: character.charisma,
      gold: character.gold,
      currentHp: character.currentHp,
      maxHp: character.maxHp,
      temporaryHp: character.temporaryHp,
      bonusSlots: character.bonusSlots,
      ancestry: character.ancestry,
      className: character.className,
      level: character.level,
      xp: character.xp,
      xpNext: character.xpNext,
      title: character.title,
      alignment: character.alignment,
      background: character.background,
      deity: character.deity,
      talentsSpells: character.talentsSpells,
      backstory: character.backstory,
      portraitUrl: character.portraitUrl,
      usedSlots: character.usedSlots,
    }
  }

  function catalogHistorySnapshot(entry: CatalogItem) {
    return {
      name: entry.name,
      slotsPerUnit: entry.slotsPerUnit,
      slotGroupSize: entry.slotGroupSize,
      freeQuantity: entry.freeQuantity,
      category: entry.category,
      lightMinutes: entry.lightMinutes,
      lightConsumesSource: entry.lightConsumesSource,
      lightFuelItemName: entry.lightFuelItemName,
      lightFuelQuantity: entry.lightFuelQuantity,
      weaponDamage: entry.weaponDamage,
      weaponRange: entry.weaponRange,
      weaponProperties: entry.weaponProperties,
      handsRequired: entry.handsRequired,
      armorClass: entry.armorClass,
      armorProperties: entry.armorProperties,
      isMagical: entry.isMagical,
      isQuestItem: entry.isQuestItem,
      magicDescription: entry.magicDescription,
      description: entry.description,
      containerContent: entry.containerContent,
      maxUses: entry.maxUses,
    }
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
          dexterity: characterDexterity,
          constitution: characterConstitution,
          intelligence: characterIntelligence,
          wisdom: characterWisdom,
          charisma: characterCharisma,
          gold: characterGold,
          currentHp: Math.min(
            characterCurrentHp,
            characterMaxHp + characterTemporaryHp
          ),
          maxHp: characterMaxHp,
          temporaryHp: characterTemporaryHp,
          bonusSlots: characterBonusSlots,
          ancestry: characterAncestry,
          className: characterClassName,
          level: characterLevel,
          xp: characterXp,
          xpNext: characterXpNext,
          title: characterTitle,
          alignment: characterAlignment,
          background: characterBackground,
          deity: characterDeity,
          talentsSpells: characterTalentsSpells,
          backstory: characterBackstory,
          portraitUrl: characterPortraitUrl,
          usedSlots: usedSlotsForCharacter(editingCharacter.id),
        })
        flash(
          `Zaktualizowano Postać: ${characterName}.`,
          'character',
          {
            kind: 'character_patch',
            characterId: editingCharacter.id,
            before: characterHistorySnapshot(editingCharacter),
            after: {
              name: characterName,
              strength: characterStrength,
              dexterity: characterDexterity,
              constitution: characterConstitution,
              intelligence: characterIntelligence,
              wisdom: characterWisdom,
              charisma: characterCharisma,
              gold: characterGold,
              currentHp: Math.min(
                characterCurrentHp,
                characterMaxHp + characterTemporaryHp
              ),
              maxHp: characterMaxHp,
              temporaryHp: characterTemporaryHp,
              bonusSlots: characterBonusSlots,
              ancestry: characterAncestry,
              className: characterClassName,
              level: characterLevel,
              xp: characterXp,
              xpNext: characterXpNext,
              title: characterTitle,
              alignment: characterAlignment,
              background: characterBackground,
              deity: characterDeity,
              talentsSpells: characterTalentsSpells,
              backstory: characterBackstory,
              portraitUrl: characterPortraitUrl,
              usedSlots: usedSlotsForCharacter(editingCharacter.id),
            },
          }
        )
      } else {
        await createCharacter(activeId, characterName, characterStrength, characterGold, {
          dexterity: characterDexterity,
          constitution: characterConstitution,
          intelligence: characterIntelligence,
          wisdom: characterWisdom,
          charisma: characterCharisma,
          currentHp: Math.min(
            characterCurrentHp,
            characterMaxHp + characterTemporaryHp
          ),
          maxHp: characterMaxHp,
          temporaryHp: characterTemporaryHp,
          bonusSlots: characterBonusSlots,
          ancestry: characterAncestry,
          className: characterClassName,
          level: characterLevel,
          xp: characterXp,
          xpNext: characterXpNext,
          title: characterTitle,
          alignment: characterAlignment,
          background: characterBackground,
          deity: characterDeity,
          talentsSpells: characterTalentsSpells,
          backstory: characterBackstory,
          portraitUrl: characterPortraitUrl,
        })
        flash(`Dodano Postać: ${characterName}.`, 'character')
      }

      setShowCharacter(false)
      setEditingCharacter(null)
      await refreshCharacters()
    } catch (e: any) {
      console.error('SAVE CHARACTER ERROR:', e)
      setError(e?.message || e?.details || 'Nie udało się zapisać postaci.')
    }
  }

  function fullCharacterChanges(
    character: Character,
    overrides: Partial<{
      gold: number
      currentHp: number
      maxHp: number
      temporaryHp: number
      bonusSlots: number
      xp: number
      xpNext: number
      portraitUrl: string
      usedSlots: number
    }> = {}
  ) {
    return {
      name: character.name,
      strength: character.strength,
      dexterity: character.dexterity,
      constitution: character.constitution,
      intelligence: character.intelligence,
      wisdom: character.wisdom,
      charisma: character.charisma,
      gold: overrides.gold ?? character.gold,
      currentHp: overrides.currentHp ?? character.currentHp,
      maxHp: overrides.maxHp ?? character.maxHp,
      temporaryHp: overrides.temporaryHp ?? character.temporaryHp,
      bonusSlots: overrides.bonusSlots ?? character.bonusSlots,
      ancestry: character.ancestry,
      className: character.className,
      level: character.level,
      xp: overrides.xp ?? character.xp,
      xpNext: overrides.xpNext ?? character.xpNext,
      title: character.title,
      alignment: character.alignment,
      background: character.background,
      deity: character.deity,
      talentsSpells: character.talentsSpells,
      backstory: character.backstory,
      portraitUrl: overrides.portraitUrl ?? character.portraitUrl,
      usedSlots: overrides.usedSlots ?? usedSlotsForCharacter(character.id),
    }
  }

  async function adjustCharacterXp(character: Character, delta: number) {
    const nextXp = Math.max(0, character.xp + delta)

    try {
      await updateCharacter(
        character.id,
        fullCharacterChanges(character, { xp: nextXp })
      )
      await refreshCharacters()
      flash(
        `${character.name}: XP ${character.xp} → ${nextXp}.`,
        'character',
        {
          kind: 'character_patch',
          characterId: character.id,
          before: { xp: character.xp },
          after: { xp: nextXp },
        }
      )
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zmienić XP.')
    }
  }

  function effectiveMaxHp(character: Character) {
    return Math.max(1, character.maxHp) + Math.max(0, character.temporaryHp)
  }

  async function adjustCharacterHp(character: Character, delta: number) {
    const maxHp = effectiveMaxHp(character)
    const nextHp = Math.min(
      maxHp,
      Math.max(0, character.currentHp + delta)
    )

    if (nextHp === character.currentHp) return

    try {
      await updateCharacter(
        character.id,
        fullCharacterChanges(character, { currentHp: nextHp })
      )
      await refreshCharacters()
      flash(
        `${character.name}: HP ${character.currentHp} → ${nextHp}.`,
        'character',
        {
          kind: 'character_patch',
          characterId: character.id,
          before: { currentHp: character.currentHp },
          after: { currentHp: nextHp },
        }
      )
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zmienić HP.')
    }
  }

  async function setCharacterTemporaryHpValue(
    character: Character,
    value: number
  ) {
    const nextTemporaryHp = Math.max(0, Math.floor(value))
    const nextEffectiveMax = character.maxHp + nextTemporaryHp
    const nextCurrentHp = Math.min(character.currentHp, nextEffectiveMax)

    try {
      await updateCharacter(
        character.id,
        fullCharacterChanges(character, {
          temporaryHp: nextTemporaryHp,
          currentHp: nextCurrentHp,
        })
      )
      await refreshCharacters()
      flash(
        `${character.name}: tymczasowe HP ${character.temporaryHp} → ${nextTemporaryHp}. Maksymalne HP: ${nextEffectiveMax}.`,
        'character',
        {
          kind: 'character_patch',
          characterId: character.id,
          before: {
            temporaryHp: character.temporaryHp,
            currentHp: character.currentHp,
          },
          after: {
            temporaryHp: nextTemporaryHp,
            currentHp: nextCurrentHp,
          },
        }
      )
    } catch (e: any) {
      setError(
        e?.message ||
          e?.details ||
          'Nie udało się zmienić tymczasowego HP.'
      )
    }
  }

  async function setCharacterBonusSlotsValue(
    character: Character,
    value: number
  ) {
    const nextBonusSlots = Math.max(0, Math.floor(value))
    if (nextBonusSlots === character.bonusSlots) return

    try {
      await updateCharacter(
        character.id,
        fullCharacterChanges(character, { bonusSlots: nextBonusSlots })
      )
      await refreshCharacters()
      flash(
        `${character.name}: bonusowe sloty ${character.bonusSlots} → ${nextBonusSlots}.`,
        'character',
        {
          kind: 'character_patch',
          characterId: character.id,
          before: { bonusSlots: character.bonusSlots },
          after: { bonusSlots: nextBonusSlots },
        }
      )
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zmienić bonusowych slotów.')
    }
  }

  function xpCalculatorControl(character: Character) {
    const draft = xpCalcDrafts[character.id] ?? ''
    const amount = Math.floor(Number(draft))
    const valid = draft.trim() !== '' && Number.isFinite(amount) && amount > 0

    async function applyXpDelta(sign: 1 | -1) {
      if (!valid) return
      await adjustCharacterXp(character, sign * amount)
      setXpCalcDrafts(current => ({ ...current, [character.id]: '' }))
    }

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={event =>
            setXpCalcDrafts(current => ({
              ...current,
              [character.id]: event.target.value.replace(/[^0-9]/g, ''),
            }))
          }
          placeholder="wartość"
          title="Wpisz liczbę XP"
          style={{
            width: 66,
            minWidth: 66,
            padding: '5px 7px',
            borderRadius: 6,
            border: '1px solid rgba(75, 118, 153, 0.72)',
            background: 'rgba(18, 16, 13, 0.96)',
            color: '#d5e5f1',
            fontWeight: 700,
            textAlign: 'center',
          }}
        />
        <button
          type="button"
          className="secondary"
          disabled={!valid}
          onClick={() => void applyXpDelta(1)}
          style={{ minWidth: 34, padding: '5px 8px', fontWeight: 900 }}
        >
          +
        </button>
        <button
          type="button"
          className="secondary"
          disabled={!valid || character.xp === 0}
          onClick={() => void applyXpDelta(-1)}
          style={{ minWidth: 34, padding: '5px 8px', fontWeight: 900 }}
        >
          −
        </button>
        <span
          title="Zmiana zostanie zapisana po użyciu + lub −"
          style={{ color: valid ? '#78b879' : '#6f695e', fontWeight: 900 }}
        >
          ✓
        </span>
      </span>
    )
  }

  function hpCalculatorControl(character: Character) {
    const draft = hpCalcDrafts[character.id] ?? ''
    const amount = Math.floor(Number(draft))
    const valid = draft.trim() !== '' && Number.isFinite(amount) && amount > 0

    async function applyHpDelta(sign: 1 | -1) {
      if (!valid) return
      await adjustCharacterHp(character, sign * amount)
      setHpCalcDrafts(current => ({ ...current, [character.id]: '' }))
    }

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={event =>
            setHpCalcDrafts(current => ({
              ...current,
              [character.id]: event.target.value.replace(/[^0-9]/g, ''),
            }))
          }
          placeholder="wartość"
          title="Wpisz liczbę HP"
          style={{
            width: 66,
            minWidth: 66,
            padding: '5px 7px',
            borderRadius: 6,
            border: '1px solid rgba(138, 101, 48, 0.72)',
            background: 'rgba(18, 16, 13, 0.96)',
            color: '#e6cf9c',
            fontWeight: 700,
            textAlign: 'center',
          }}
        />
        <button type="button" className="secondary" disabled={!valid} onClick={() => void applyHpDelta(1)} style={{ minWidth: 34, padding: '5px 8px', fontWeight: 900 }}>+</button>
        <button type="button" className="secondary" disabled={!valid} onClick={() => void applyHpDelta(-1)} style={{ minWidth: 34, padding: '5px 8px', fontWeight: 900 }}>−</button>
        <span title="Zmiana zostanie zapisana po użyciu + lub −" style={{ color: valid ? '#78b879' : '#6f695e', fontWeight: 900 }}>✓</span>
      </span>
    )
  }

  async function uploadCharacterPortrait(
    character: Character,
    file: File
  ) {
    if (!supabase || !activeId) return

    if (!file.type.startsWith('image/')) {
      setError('Portret musi być plikiem graficznym.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Portret może mieć maksymalnie 5 MB.')
      return
    }

    const extension =
      file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ||
      'jpg'
    const objectPath = `${activeId}/${character.id}/${Date.now()}.${extension}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('character-portraits')
        .upload(objectPath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('character-portraits')
        .getPublicUrl(objectPath)

      const portraitUrl = data.publicUrl

      await updateCharacter(
        character.id,
        fullCharacterChanges(character, { portraitUrl })
      )

      await refreshCharacters()
      flash(
        `${character.name}: zmieniono portret.`,
        'character',
        {
          kind: 'character_patch',
          characterId: character.id,
          before: { portraitUrl: character.portraitUrl },
          after: { portraitUrl },
        }
      )
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się przesłać portretu.')
    }
  }

  const cemeteryCharacters = useMemo(
    () =>
      characters
        .filter(character => deadCharacterIds.has(character.id))
        .sort((a, b) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' })),
    [characters, deadCharacterIds]
  )

  const cemeterySelectedCharacter = useMemo(
    () =>
      cemeterySelectedCharacterId
        ? characters.find(character => character.id === cemeterySelectedCharacterId) ?? null
        : null,
    [characters, cemeterySelectedCharacterId]
  )

  function memorialForCharacter(characterId: string) {
    return characterMemorials.find(memorial => memorial.characterId === characterId) ?? null
  }

  function openDeathCharacter(character: Character) {
    const latestChronicle = chronicleEntries[chronicleEntries.length - 1]
    setDeathCharacter(character)
    setDeathDay(latestChronicle ? String(latestChronicle.worldDay) : '')
    setDeathSession(latestChronicle ? String(latestChronicle.sessionNumber) : '')
    setDeathCause('')
    setShowDeathModal(true)
  }

  async function confirmCharacterDeath() {
    if (!activeId || !deathCharacter) return
    try {
      await markCharacterDead(activeId, deathCharacter.id, {
        deathDay: deathDay ? Math.max(1, Number(deathDay)) : null,
        deathSession: deathSession ? Math.max(1, Number(deathSession)) : null,
        deathCause: deathCause.trim() || null,
      })
      if (selectedCharacterId === deathCharacter.id) setSelectedCharacterId(null)
      setShowDeathModal(false)
      setDeathCharacter(null)
      await refreshCemetery()
      flash(`${deathCharacter.name} został przeniesiony na Cmentarz.`, 'character')
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się przenieść postaci na Cmentarz.')
    }
  }

  async function restoreDeadCharacter(character: Character) {
    const confirmed = window.confirm(
      `Przywrócić postać „${character.name}” do aktywnej drużyny?`
    )
    if (!confirmed) return
    try {
      await restoreCharacterFromCemetery(character.id)
      await refreshCemetery()
      flash(`${character.name} wrócił do aktywnej drużyny.`, 'character')
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się przywrócić postaci.')
    }
  }

  const sortedCharacters = useMemo(
    () =>
      [...activeCharacters].sort((a, b) =>
        a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' })
      ),
    [activeCharacters]
  )

  const visibleCharacters = useMemo(
    () =>
      selectedCharacterId
        ? activeCharacters.filter(character => character.id === selectedCharacterId)
        : activeCharacters,
    [activeCharacters, selectedCharacterId]
  )

  const selectedCharacter = useMemo(
    () =>
      selectedCharacterId
        ? activeCharacters.find(character => character.id === selectedCharacterId) ?? null
        : null,
    [activeCharacters, selectedCharacterId]
  )

  function openCharacterCard(characterId: string) {
    setSelectedCharacterId(characterId)
    setActiveView('Postacie')
    setMobileNav(false)
  }

  function openAllCharacters() {
    setSelectedCharacterId(null)
    setActiveView('Postacie')
    setMobileNav(false)
  }

  function equippedItemsForCharacter(characterId: string) {
    return itemsForCharacter(characterId).filter(item => item.isEquipped)
  }

  function equippedWeaponForCharacter(characterId: string) {
    return equippedItemsForCharacter(characterId).find(item => item.category === 'weapon') ?? null
  }

  function equippedShieldForCharacter(characterId: string) {
    return equippedItemsForCharacter(characterId).find(
      item => item.category === 'armor' && /^\s*\+/.test(item.armorClass ?? '')
    ) ?? null
  }

  function activeLightForCharacter(characterId: string) {
    return itemsForCharacter(characterId).find(item => item.isActiveLight) ?? null
  }

  function weaponHandsRequired(item: CharacterItem | null): 1 | 2 {
    if (!item || item.category !== 'weapon') return 1

    const catalogItem = catalogEntryForItem(item.catalogItemId)
    if (catalogItem?.handsRequired === 2) return 2
    if (catalogItem?.handsRequired === 1) return 1

    const fallback = (item.weaponProperties ?? '')
      .toLowerCase()
      .replace(/[()]/g, ' ')
      .replace(/two[\s-]?handed/g, '2h')

    return /(^|[\s,;])2h($|[\s,;])/.test(fallback) ? 2 : 1
  }

  function weaponIsTwoHanded(item: CharacterItem | null) {
    return weaponHandsRequired(item) === 2
  }

  function handConflictForLoadout(characterId: string, nextItem?: CharacterItem) {
    let weapon = equippedWeaponForCharacter(characterId)
    let shield = equippedShieldForCharacter(characterId)
    const light = activeLightForCharacter(characterId)

    if (nextItem?.category === 'weapon') weapon = nextItem
    if (nextItem?.category === 'armor' && /^\s*\+/.test(nextItem.armorClass ?? '')) {
      shield = nextItem
    }

    const used =
      (weapon ? weaponHandsRequired(weapon) : 0) +
      (shield ? 1 : 0) +
      (light ? 1 : 0)

    if (used <= 2) return null
    if (weapon && weaponHandsRequired(weapon) === 2 && shield) {
      return 'Broń dwuręczna zajmuje obie ręce i nie może być używana z tarczą.'
    }
    if (weapon && weaponHandsRequired(weapon) === 2 && light) {
      return 'Broń dwuręczna zajmuje obie ręce i nie może być używana razem ze źródłem światła.'
    }
    return 'Broń, tarcza i źródło światła wymagają łącznie 3 rąk.'
  }

  function canCharacterCarryActiveLight(characterId: string) {
    const weapon = equippedWeaponForCharacter(characterId)
    const shield = equippedShieldForCharacter(characterId)
    const used = (weapon ? weaponHandsRequired(weapon) : 0) + (shield ? 1 : 0)

    if (used < 2) return null
    if (weapon && weaponHandsRequired(weapon) === 2) {
      return 'Ta Postać używa broni dwuręcznej i nie ma wolnej ręki na źródło światła.'
    }
    return 'Ta Postać używa broni i tarczy, więc nie ma wolnej ręki na źródło światła.'
  }

  function handsDisplayForCharacter(characterId: string) {
    const weapon = equippedWeaponForCharacter(characterId)
    const shield = equippedShieldForCharacter(characterId)
    const light = activeLightForCharacter(characterId)
    const parts: string[] = []

    if (weapon) parts.push(`${weapon.name}${weapon.weaponDamage ? ` (${weapon.weaponDamage})` : ''}`)
    if (shield) parts.push(shield.name)
    if (light) parts.push(light.name)

    return parts.length ? parts.join(' + ') : '—'
  }

  function parseArmorBase(
    armorClass: string | null,
    dexModifier: number
  ): number | null {
    if (!armorClass) return null

    const normalized = armorClass
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace('dexterity', 'dex')

    if (/^\s*\+/.test(normalized)) return null

    const baseMatch = normalized.match(/-?\d+/)
    if (!baseMatch) return null

    const base = Number(baseMatch[0])
    return normalized.includes('dex') ? base + dexModifier : base
  }

  function armorClassForCharacter(character: Character) {
    const dex = statModifier(character.dexterity)
    const equipped = equippedItemsForCharacter(character.id)
    const armors = equipped.filter(item => item.category === 'armor')

    const bodyArmor = armors.find(
      item => !/^\s*\+/.test(item.armorClass ?? '')
    )

    const baseAc = bodyArmor
      ? parseArmorBase(bodyArmor.armorClass, dex) ?? 10 + dex
      : 10 + dex

    const shieldBonus = armors
      .filter(item => /^\s*\+/.test(item.armorClass ?? ''))
      .reduce((sum, item) => {
        const match = (item.armorClass ?? '').match(/[+-]?\d+/)
        return sum + (match ? Number(match[0]) : 0)
      }, 0)

    return baseAc + shieldBonus
  }

  async function toggleEquippedItem(
    character: Character,
    item: CharacterItem
  ) {
    if (!item.isEquipped) {
      const conflict = handConflictForLoadout(character.id, item)
      if (conflict) {
        setError(conflict)
        return
      }
    }

    try {
      await setCharacterItemEquipped(item.id, !item.isEquipped)
      await refreshItems()

      flash(
        item.isEquipped
          ? `${character.name} — zdjęto/odłożono ${item.name}.`
          : `${character.name} — wyposażono ${item.name}.`,
        'inventory',
        {
          kind: 'character_item_flag',
          itemId: item.id,
          flag: 'equipped',
          before: item.isEquipped,
          after: !item.isEquipped,
        }
      )
    } catch (e: any) {
      setError(
        e?.message ||
          e?.details ||
          'Nie udało się zmienić aktywnego wyposażenia.'
      )
    }
  }

  function quickpullLimit(character: Character) {
    return Math.max(0, statModifier(character.dexterity))
  }

  function quickpullCount(characterId: string) {
    return itemsForCharacter(characterId).filter(item => item.isQuickpull).length
  }

  async function toggleQuickpull(character: Character, item: CharacterItem) {
    try {
      await setCharacterItemQuickpull(item.id, !item.isQuickpull)
      await refreshItems()
      flash(
        item.isQuickpull
          ? `"${item.name}" usunięto z Quickpull.`
          : `"${item.name}" oznaczono jako Quickpull.`,
        'inventory',
        {
          kind: 'character_item_flag',
          itemId: item.id,
          flag: 'quickpull',
          before: item.isQuickpull,
          after: !item.isQuickpull,
        }
      )
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zmienić Quickpull.')
    }
  }

  async function removeCharacter(character: Character) {
    const confirmed = window.confirm(
      `Czy na pewno usunąć postać "${character.name}"?`
    )

    if (!confirmed) return

    try {
      const undoBefore = await captureUndoScopes([
        { table: 'characters', filters: { id: character.id } },
        { table: 'character_items', filters: { character_id: character.id } },
      ])
      await deleteCharacter(character.id)
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(`Usunięto Postać: ${character.name}.`, 'character', undoPayload)
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

  function containerBaseName(
    name: string,
    content?: string | null
  ) {
    const trimmed = name.trim()

    if (
      trimmed.toLowerCase() === "miner's putty jar" ||
      trimmed.toLowerCase() === 'miner’s putty jar'
    ) {
      return 'Jar'
    }

    const currentContent = (content ?? '').trim()
    if (
      currentContent &&
      trimmed.toLowerCase().endsWith(
        ` - ${currentContent}`.toLowerCase()
      )
    ) {
      return trimmed.slice(
        0,
        trimmed.length - currentContent.length - 3
      ).trim()
    }

    const separatorIndex = trimmed.indexOf(' - ')
    if (separatorIndex > 0) {
      return trimmed.slice(0, separatorIndex).trim()
    }

    return trimmed
  }

  function containerDisplayName(
    name: string,
    content?: string | null
  ) {
    const base = containerBaseName(name, content)
    const normalizedContent = (content ?? '').trim()
    return normalizedContent
      ? `${base} - ${normalizedContent}`
      : base
  }

  function openFillContainer(
    item: CharacterItem
  ) {
    const entry = catalogEntryForItem(item.catalogItemId)

    if (!entry) {
      setError(
        'Ten pojemnik nie jest połączony z przedmiotem w Bibliotece.'
      )
      return
    }

    setFillingContainerItem(item)
    setEditingCatalogItem(entry)
    setCatalogName(
      containerBaseName(
        entry.name,
        entry.containerContent
      )
    )
    setCatalogSlotsPerUnit(entry.slotsPerUnit)
    setCatalogSlotGroupSize(entry.slotGroupSize)
    setCatalogFreeQuantity(entry.freeQuantity)
    setCatalogCategory('container')
    setCatalogLightMinutes(entry.lightMinutes ?? 60)
    setCatalogWeaponDamage(entry.weaponDamage ?? '')
    setCatalogWeaponRange(entry.weaponRange ?? '')
    setCatalogWeaponProperties(entry.weaponProperties ?? '')
    setCatalogHandsRequired(entry.handsRequired)
    setCatalogArmorClass(entry.armorClass ?? '')
    setCatalogArmorProperties(entry.armorProperties ?? '')
    setCatalogIsMagical(entry.isMagical)
    setCatalogIsQuestItem(entry.isQuestItem)
    setCatalogMagicDescription(entry.magicDescription ?? '')
    setCatalogDescription(entry.description ?? '')
    setCatalogContainerContent(entry.containerContent ?? '')
    setCatalogMaxUses(entry.maxUses)
    setCatalogContainerFill(
      Math.min(
        entry.maxUses,
        Math.max(0, item.usesRemaining)
      )
    )
    setActiveView('Biblioteka')
    setShowCatalogItem(true)
  }

  function openNewCatalogItem() {
    setEditingCatalogItem(null)
    setCatalogName('')
    setCatalogSlotsPerUnit(1)
    setCatalogSlotGroupSize(1)
    setCatalogFreeQuantity(0)
    setCatalogCategory('normal')
    setCatalogLightMinutes(60)
    setCatalogWeaponDamage('')
    setCatalogWeaponRange('')
    setCatalogWeaponProperties('')
    setCatalogHandsRequired(1)
    setCatalogArmorClass('')
    setCatalogArmorProperties('')
    setCatalogIsMagical(false)
    setCatalogIsQuestItem(false)
    setCatalogMagicDescription('')
    setCatalogDescription('')
    setCatalogContainerContent('')
    setCatalogContainerFill(0)
    setFillingContainerItem(null)
    setCatalogMaxUses(0)
    setShowCatalogItem(true)
  }

  function openEditCatalogItem(entry: CatalogItem) {
    setFillingContainerItem(null)
    setEditingCatalogItem(entry)
    setCatalogName(entry.name)
    setCatalogSlotsPerUnit(entry.slotsPerUnit)
    setCatalogSlotGroupSize(entry.slotGroupSize)
    setCatalogFreeQuantity(entry.freeQuantity)
    setCatalogCategory(entry.category)
    setCatalogLightMinutes(entry.lightMinutes ?? 60)
    setCatalogWeaponDamage(entry.weaponDamage ?? '')
    setCatalogWeaponRange(entry.weaponRange ?? '')
    setCatalogWeaponProperties(entry.weaponProperties ?? '')
    setCatalogHandsRequired(entry.handsRequired)
    setCatalogArmorClass(entry.armorClass ?? '')
    setCatalogArmorProperties(entry.armorProperties ?? '')
    setCatalogIsMagical(entry.isMagical)
    setCatalogIsQuestItem(entry.isQuestItem)
    setCatalogMagicDescription(entry.magicDescription ?? '')
    setCatalogDescription(entry.description ?? '')
    setCatalogContainerContent(entry.containerContent ?? '')
    setCatalogMaxUses(entry.maxUses)
    setShowCatalogItem(true)
  }

  async function saveCatalogItem() {
    if (!activeId || !catalogName.trim()) return

    const effectiveCatalogName =
      catalogCategory === 'container'
        ? containerBaseName(
            catalogName,
            catalogContainerContent
          )
        : catalogName

    const changes = {
      name: effectiveCatalogName,
      slotsPerUnit: catalogSlotsPerUnit,
      slotGroupSize: catalogSlotGroupSize,
      freeQuantity: catalogFreeQuantity,
      category: catalogCategory,
      lightMinutes:
        catalogCategory === 'light' ? catalogLightMinutes : null,
      weaponDamage:
        catalogCategory === 'weapon' ? catalogWeaponDamage : null,
      weaponRange:
        catalogCategory === 'weapon' ? catalogWeaponRange : null,
      weaponProperties:
        catalogCategory === 'weapon' ? catalogWeaponProperties : null,
      handsRequired:
        catalogCategory === 'weapon' ? catalogHandsRequired : (1 as const),
      armorClass:
        catalogCategory === 'armor' ? catalogArmorClass : null,
      armorProperties:
        catalogCategory === 'armor' ? catalogArmorProperties : null,
      isMagical: catalogIsMagical,
      isQuestItem: catalogIsQuestItem,
      magicDescription:
        catalogIsMagical ? catalogMagicDescription : null,
      description: catalogDescription,
      containerContent:
        catalogCategory === 'container' && fillingContainerItem
          ? catalogContainerContent
          : null,
      maxUses: catalogMaxUses,
    }

    try {
      if (
        fillingContainerItem &&
        editingCatalogItem &&
        catalogCategory === 'container'
      ) {
        const enteredContent =
          catalogContainerContent.trim()

        const maxUses = Math.max(
          0,
          Math.floor(catalogMaxUses)
        )
        const usesRemaining = enteredContent
          ? Math.max(
              0,
              Math.min(
                maxUses,
                Math.floor(catalogContainerFill)
              )
            )
          : 0

        const normalizedContent =
          usesRemaining > 0 ? enteredContent : ''

        const baseName = containerBaseName(
          editingCatalogItem.name,
          editingCatalogItem.containerContent
        )
        const variantName = normalizedContent
          ? `${baseName} - ${normalizedContent}`
          : baseName

        let targetEntry = catalog.find(
          entry =>
            entry.category === 'container' &&
            entry.name.trim().toLowerCase() ===
              variantName.trim().toLowerCase() &&
            (entry.containerContent ?? '')
              .trim()
              .toLowerCase() ===
              normalizedContent.toLowerCase()
        )

        const fillChanges = {
          ...changes,
          name: variantName,
          containerContent: normalizedContent || null,
          maxUses,
        }

        if (!targetEntry) {
          targetEntry = await createCatalogItem({
            campaignId: activeId,
            ...fillChanges,
          })
        } else {
          targetEntry = await updateCatalogItem(
            targetEntry.id,
            fillChanges
          )
        }

        const inventoryName =
          usesRemaining > 0 && normalizedContent
            ? variantName
            : baseName

        await updateItem(
          fillingContainerItem.id,
          fillingContainerItem.characterId,
          {
            catalogItemId: targetEntry.id,
            name: inventoryName,
            quantity: fillingContainerItem.quantity,
            slotsPerUnit: targetEntry.slotsPerUnit,
            slotGroupSize: targetEntry.slotGroupSize,
            freeQuantity: targetEntry.freeQuantity,
            category: 'container',
            lightMinutes: null,
            weaponDamage: null,
            weaponRange: null,
            weaponProperties: null,
            armorClass: null,
            armorProperties: null,
            maxUses,
            usesRemaining,
          }
        )

        await Promise.all([
          refreshCatalog(),
          refreshItems(),
          refreshCharacters(),
        ])

        setShowCatalogItem(false)
        setEditingCatalogItem(null)
        setFillingContainerItem(null)
        flash(
          `${inventoryName}: ustawiono zawartość ${usesRemaining}/${maxUses}.`,
          'inventory'
        )
        return
      }

      if (editingCatalogItem) {
        const updated = await updateCatalogItem(
          editingCatalogItem.id,
          changes
        )

        setCatalog(prev =>
          [
            ...prev.filter(item => item.id !== updated.id),
            updated,
          ].sort((a, b) => a.name.localeCompare(b.name, 'pl'))
        )

        setShowCatalogItem(false)
        flash(
          `Biblioteka — zaktualizowano: ${updated.name}.`,
          'library',
          {
            kind: 'catalog_restore',
            catalogItemId: editingCatalogItem.id,
            before: catalogHistorySnapshot(editingCatalogItem),
            after: catalogHistorySnapshot(updated),
          }
        )
        setEditingCatalogItem(null)
      } else {
        const created = await createCatalogItem({
          campaignId: activeId,
          ...changes,
        })

        setCatalog(prev =>
          [
            ...prev.filter(item => item.id !== created.id),
            created,
          ].sort((a, b) => a.name.localeCompare(b.name, 'pl'))
        )

        applyCatalogItem(created)
        setShowCatalogItem(false)
        flash(`Biblioteka — dodano: ${created.name}.`, 'library')
      }
    } catch (e: any) {
      setError(
        e?.message ||
          e?.details ||
          (editingCatalogItem
            ? 'Nie udało się zaktualizować przedmiotu w katalogu.'
            : 'Nie udało się dodać przedmiotu do katalogu.')
      )
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
      maxUses: itemCatalogItemId
        ? catalog.find(entry => entry.id === itemCatalogItemId)?.maxUses ?? 0
        : 0,
    }

    try {
      if (editingItem) {
        await updateItem(editingItem.id, itemCharacterId, details)
        flash(
          `${characters.find(character => character.id === itemCharacterId)?.name ?? 'Postać'} — zaktualizowano ${itemName}.`,
          'inventory'
        )
      } else {
        await createItem({
          campaignId: activeId,
          characterId: itemCharacterId,
          ...details,
        })
        flash(
          `${characters.find(character => character.id === itemCharacterId)?.name ?? 'Postać'} — dodano ${itemQuantity} × ${itemName}.`,
          'inventory'
        )
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
      const undoBefore = await captureUndoScopes([
        { table: 'character_items', filters: { id: item.id } },
      ])
      await deleteItem(item.id, item.characterId)
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(
        `${characters.find(character => character.id === item.characterId)?.name ?? 'Postać'} — usunięto ${item.quantity} × ${item.name}.`,
        'inventory',
        undoPayload
      )
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
      const owner = characters.find(character => character.id === item.characterId)
      flash(
        `${owner?.name ?? 'Postać'} — zużyto 1 × ${item.name}.`,
        item.category === 'food' ? 'food' : 'inventory'
      )
      await Promise.all([refreshItems(), refreshCharacters()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zużyć przedmiotu.')
    }
  }


  async function consumeItemUse(
    ownerType: InventoryOwnerType,
    item: {
      id: string
      name: string
      maxUses?: number
      usesRemaining?: number
    }
  ) {
    const maxUses = Math.max(0, Number(item.maxUses ?? 0))
    const usesRemaining = Math.max(0, Number(item.usesRemaining ?? 0))
    if (!activeId || maxUses <= 0 || usesRemaining <= 0) return

    try {
      await consumeInventoryItemUse({
        campaignId: activeId,
        ownerType,
        itemId: item.id,
      })

      await Promise.all([
        refreshInventoryOwners(
          [ownerType],
          ownerType === 'character'
        ),
        refreshCatalog(),
      ])

      flash(
        `${item.name}: użycia ${usesRemaining} → ${usesRemaining - 1}.`,
        'inventory'
      )
    } catch (e: any) {
      setError(
        e?.message ||
          e?.details ||
          'Nie udało się zużyć użycia przedmiotu.'
      )
    }
  }

  async function adjustContainerContent(
    ownerType: InventoryOwnerType,
    item: {
      id: string
      name: string
      catalogItemId?: string | null
      maxUses?: number
      usesRemaining?: number
    },
    delta: number
  ) {
    const maxUses = Math.max(0, Number(item.maxUses ?? 0))
    const usesRemaining = Math.max(0, Number(item.usesRemaining ?? 0))
    if (!activeId || maxUses <= 0) return

    const contentName = (
      containerContentForItem(item.catalogItemId ?? null) ?? ''
    ).trim()

    if (delta > 0 && !contentName) {
      setError(
        'Pusty pojemnik nie ma przypisanej substancji. Użyj przycisku NAPEŁNIJ.'
      )
      return
    }

    const next = Math.max(0, Math.min(maxUses, usesRemaining + delta))
    if (next === usesRemaining) return

    try {
      await adjustContainerInventoryContent({
        campaignId: activeId,
        ownerType,
        itemId: item.id,
        delta,
      })
      await refreshInventoryOwners(
        [ownerType],
        ownerType === 'character'
      )
      flash(
        `${item.name}: zawartość ${usesRemaining}/${maxUses} → ${next}/${maxUses}.`,
        'inventory'
      )
    } catch (e: any) {
      setError(
        e?.message ||
          e?.details ||
          'Nie udało się zmienić zawartości pojemnika.'
      )
    }
  }

  function itemUsesControl(
    ownerType: InventoryOwnerType,
    item: {
      id: string
      name: string
      category?: ItemCategory
      catalogItemId?: string | null
      maxUses?: number
      usesRemaining?: number
    }
  ) {
    const maxUses = Math.max(0, Number(item.maxUses ?? 0))
    const usesRemaining = Math.max(0, Number(item.usesRemaining ?? 0))
    if (maxUses <= 0) return null

    const isContainer = item.category === 'container'
    const contentName = isContainer
      ? containerContentForItem(item.catalogItemId ?? null)
      : null

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          marginLeft: 7,
          padding: '3px 7px',
          borderRadius: 6,
          border: '1px solid rgba(166, 126, 58, 0.55)',
          background: 'rgba(103, 75, 31, 0.13)',
          whiteSpace: 'nowrap',
        }}
      >
        <span className="muted">
          {isContainer
            ? usesRemaining > 0 && contentName
              ? `Zawartość: ${contentName}`
              : 'Zawartość: pusto'
            : 'Użycia'}
        </span>
        <strong>
          {usesRemaining}/{maxUses}
        </strong>

        {isContainer && (
          <button
            type="button"
            className="secondary"
            disabled={
              usesRemaining >= maxUses ||
              !String(contentName ?? '').trim()
            }
            onClick={() =>
              void adjustContainerContent(ownerType, item, 1)
            }
            title={
              !String(contentName ?? '').trim()
                ? 'Najpierw użyj NAPEŁNIJ i wybierz substancję'
                : 'Uzupełnij pojemnik o 1'
            }
            style={{
              minWidth: 28,
              minHeight: 24,
              padding: '2px 6px',
            }}
          >
            +1
          </button>
        )}

        <button
          type="button"
          className="secondary"
          disabled={usesRemaining <= 0}
          onClick={() =>
            isContainer
              ? void adjustContainerContent(ownerType, item, -1)
              : void consumeItemUse(ownerType, item)
          }
          title={
            usesRemaining > 0
              ? isContainer
                ? 'Opróżnij pojemnik o 1'
                : 'Zużyj 1 użycie'
              : isContainer
                ? 'Pojemnik jest pusty'
                : 'Brak pozostałych użyć'
          }
          style={{
            minWidth: 28,
            minHeight: 24,
            padding: '2px 6px',
          }}
        >
          −1
        </button>
      </span>
    )
  }

  function isRationCatalogItem(entry: CatalogItem | undefined | null) {
    if (!entry) return false
    const normalized = entry.name
      .trim()
      .toLocaleLowerCase('pl-PL')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    return (
      entry.category === 'food' &&
      (normalized.includes('ration') ||
        normalized.includes('racja') ||
        normalized.includes('racje'))
    )
  }

  function normalizeRationBuyQuantity(value: number) {
    const safe = Math.max(3, Math.floor(Number(value) || 3))
    return Math.ceil(safe / 3) * 3
  }

  function rationBuyPriceCp(quantity: number) {
    return (normalizeRationBuyQuantity(quantity) / 3) * 50
  }

  function moneyToCp(gp: number, sp: number, cp: number) {
    return Math.max(0, Math.round(gp) * 100 + Math.round(sp) * 10 + Math.round(cp))
  }

  function formatMoneyCp(totalCp: number) {
    const safe = Math.max(0, Math.round(totalCp))
    const gp = Math.floor(safe / 100)
    const sp = Math.floor((safe % 100) / 10)
    const cp = safe % 10
    return `${gp} GP ${sp} SP ${cp} CP`
  }

  const inventoryDestinations = useMemo(
    () => [
      ...activeCharacters.map(character => ({
        key: `character:${character.id}`,
        type: 'character' as InventoryOwnerType,
        id: character.id,
        label: `${character.name} • Postać`,
      })),
      ...npcs.map(npc => ({
        key: `npc:${npc.id}`,
        type: 'npc' as InventoryOwnerType,
        id: npc.id,
        label: `${npc.name} • NPC`,
      })),
      ...animals.map(animal => ({
        key: `animal:${animal.id}`,
        type: 'animal' as InventoryOwnerType,
        id: animal.id,
        label: `${animal.name} • Zwierzę`,
      })),
      ...bastions
        .filter(bastion =>
          bastionUpgrades.some(
            upgrade =>
              upgrade.bastionId === bastion.id &&
              upgrade.upgradeId === 'vault'
          )
        )
        .map(bastion => ({
          key: `bastion:${bastion.id}`,
          type: 'bastion' as InventoryOwnerType,
          id: bastion.id,
          label: `${bastion.name} • Vault`,
        })),
    ],
    [activeCharacters, npcs, animals, bastions, bastionUpgrades]
  )

  function openTransferItem(
    fromType: InventoryOwnerType,
    fromOwnerId: string,
    item: { id: string; name: string; quantity: number }
  ) {
    setTransferFromType(fromType)
    setTransferFromOwnerId(fromOwnerId)
    setTransferItemId(item.id)
    setTransferItemName(item.name)
    setTransferMaxQuantity(item.quantity)
    setTransferQuantity(1)

    const firstTarget = inventoryDestinations.find(
      destination =>
        destination.key !== `${fromType}:${fromOwnerId}` &&
        (!isWagonName(item.name) || destination.type === 'animal')
    )

    setTransferToKey(firstTarget?.key ?? '')
    setShowTransferItem(true)
  }

  async function executeTransferItem() {
    if (!activeId || !transferItemId || !transferToKey) {
      setError('Wybierz ekwipunek docelowy.')
      return
    }

    const target = inventoryDestinations.find(
      destination => destination.key === transferToKey
    )

    if (!target) {
      setError('Nie znaleziono ekwipunku docelowego.')
      return
    }

    const undoBefore = await captureUndoScopes([
      inventoryScopeSpec(transferFromType, transferFromOwnerId),
      inventoryScopeSpec(target.type, target.id),
    ])

    setTransferringItem(true)
    try {
      await transferInventoryItem({
        campaignId: activeId,
        fromType: transferFromType,
        itemId: transferItemId,
        toType: target.type,
        toId: target.id,
        quantity: Math.min(
          transferMaxQuantity,
          Math.max(1, transferQuantity)
        ),
      })

      const movedQuantity = Math.min(
        transferMaxQuantity,
        Math.max(1, transferQuantity)
      )
      const sourceLabel = inventoryOwnerLabel(
        transferFromType,
        transferFromOwnerId
      )

      setShowTransferItem(false)
      await refreshInventoryOwners([transferFromType, target.type])
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(
        `${sourceLabel} → ${target.label}: przeniesiono ${movedQuantity} × ${transferItemName}.`,
        'inventory',
        undoPayload
      )
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się przenieść przedmiotu.')
    } finally {
      setTransferringItem(false)
    }
  }

  async function changeCharacterCoins(
    character: Character,
    valueGp: number
  ) {
    if (!activeId) return

    const normalized = Math.max(0, Math.round(valueGp * 100) / 100)

    try {
      await updateCharacter(character.id, {
        name: character.name,
        strength: character.strength,
        dexterity: character.dexterity,
        constitution: character.constitution,
        intelligence: character.intelligence,
        wisdom: character.wisdom,
        charisma: character.charisma,
        gold: normalized,
        currentHp: character.currentHp,
        maxHp: character.maxHp,
        temporaryHp: character.temporaryHp,
        bonusSlots: character.bonusSlots,
        ancestry: character.ancestry,
        className: character.className,
        level: character.level,
        xp: character.xp,
        xpNext: character.xpNext,
        title: character.title,
        alignment: character.alignment,
        background: character.background,
        deity: character.deity,
        talentsSpells: character.talentsSpells,
        backstory: character.backstory,
        portraitUrl: character.portraitUrl,
        usedSlots: character.usedSlots,
      })

      await refreshInventoryOwners(['character'], true)
      flash(
        `${character.name}: ustawiono Coins na ${normalized.toLocaleString('pl-PL')} GP.`,
        'inventory',
        {
          kind: 'character_patch',
          characterId: character.id,
          before: { gold: character.gold },
          after: { gold: normalized },
        }
      )
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zmienić stanu Coins.')
      await refreshInventoryOwners(['character'], true)
    }
  }


  function coinCalculatorControl(character: Character) {
    const draft = coinCalcDrafts[character.id] ?? ''
    const normalizedDraft = draft.replace(',', '.').trim()
    const amount = Number(normalizedDraft)
    const valid =
      normalizedDraft !== '' &&
      Number.isFinite(amount) &&
      amount > 0

    async function applyCoinDelta(sign: 1 | -1) {
      if (!valid) return

      const nextGold = Math.max(
        0,
        Math.round((character.gold + sign * amount) * 100) / 100
      )

      await changeCharacterCoins(character, nextGold)

      setCoinCalcDrafts(current => ({
        ...current,
        [character.id]: '',
      }))
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          marginLeft: 8,
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={event => {
            const raw = event.target.value
              .replace(',', '.')
              .replace(/[^0-9.]/g, '')
              .replace(/(\..*)\./g, '$1')

            setCoinCalcDrafts(current => ({
              ...current,
              [character.id]: raw,
            }))
          }}
          placeholder="kwota"
          title="Wpisz kwotę w GP, np. 10 albo 2.5"
          style={{
            width: 66,
            minWidth: 66,
            padding: '5px 7px',
            borderRadius: 6,
            border: '1px solid rgba(138, 101, 48, 0.72)',
            background: 'rgba(18, 16, 13, 0.96)',
            color: '#e6cf9c',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.55)',
            outline: 'none',
            fontWeight: 700,
            textAlign: 'center',
          }}
        />

        <button
          type="button"
          className="secondary"
          disabled={!valid}
          onClick={() => void applyCoinDelta(1)}
          title={valid ? `Dodaj ${amount} GP` : 'Najpierw wpisz kwotę'}
          style={{
            minWidth: 34,
            padding: '5px 8px',
            fontWeight: 900,
          }}
        >
          +
        </button>

        <button
          type="button"
          className="secondary"
          disabled={!valid}
          onClick={() => void applyCoinDelta(-1)}
          title={valid ? `Odejmij ${amount} GP` : 'Najpierw wpisz kwotę'}
          style={{
            minWidth: 34,
            padding: '5px 8px',
            fontWeight: 900,
          }}
        >
          −
        </button>
      </span>
    )
  }

  async function changeInventoryQuantity(
    ownerType: InventoryOwnerType,
    itemId: string,
    quantity: number
  ) {
    if (!activeId) return

    const context = inventoryItemContext(ownerType, itemId)

    try {
      await setInventoryItemQuantity({
        campaignId: activeId,
        ownerType,
        itemId,
        quantity,
      })
      await refreshInventoryOwners([ownerType], ownerType === 'character')

      if (context) {
        flash(
          `${context.owner} — ${context.name}: ilość ${context.oldQuantity} → ${quantity}.`,
          'inventory',
          {
            kind: 'inventory_quantity',
            ownerType,
            itemId,
            before: context.oldQuantity,
            after: quantity,
          }
        )
      } else {
        flash(`Zmieniono ilość przedmiotu na ${quantity}.`, 'inventory')
      }
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zmienić ilości.')
      await refreshInventoryOwners([ownerType], ownerType === 'character')
    }
  }

  function inventoryOwnerLabel(
    ownerType: InventoryOwnerType,
    ownerId: string
  ) {
    if (ownerType === 'character') {
      const owner = characterById.get(ownerId)
      return owner ? `${owner.name} (Postać)` : 'Nieznana Postać'
    }

    if (ownerType === 'npc') {
      const owner = npcById.get(ownerId)
      return owner ? `${owner.name} (NPC)` : 'Nieznany NPC'
    }

    if (ownerType === 'animal') {
      const owner = animalById.get(ownerId)
      return owner ? `${owner.name} (Zwierzę)` : 'Nieznane Zwierzę'
    }

    const owner = bastionById.get(ownerId)
    return owner ? `${owner.name} (Vault)` : 'Nieznany Vault'
  }

  function inventoryItemContext(
    ownerType: InventoryOwnerType,
    itemId: string
  ) {
    if (ownerType === 'character') {
      const item = items.find(entry => entry.id === itemId)
      return item
        ? {
            name: item.name,
            ownerId: item.characterId,
            owner: inventoryOwnerLabel('character', item.characterId),
            oldQuantity: item.quantity,
          }
        : null
    }

    if (ownerType === 'npc') {
      const item = npcItems.find(entry => entry.id === itemId)
      return item
        ? {
            name: item.name,
            ownerId: item.npcId,
            owner: inventoryOwnerLabel('npc', item.npcId),
            oldQuantity: item.quantity,
          }
        : null
    }

    if (ownerType === 'animal') {
      const item = animalItems.find(entry => entry.id === itemId)
      return item
        ? {
            name: item.name,
            ownerId: item.animalId,
            owner: inventoryOwnerLabel('animal', item.animalId),
            oldQuantity: item.quantity,
          }
        : null
    }

    const item = bastionItems.find(entry => entry.id === itemId)
    return item
      ? {
          name: item.name,
          ownerId: item.bastionId,
          owner: inventoryOwnerLabel('bastion', item.bastionId),
          oldQuantity: item.quantity,
        }
      : null
  }

  function hasVault(bastionId: string) {
    return upgradesForBastion(bastionId).some(upgrade => upgrade.upgradeId === 'vault')
  }

  const bastionItemsByOwner = useMemo(() => {
    const grouped = new Map<string, BastionItem[]>()
    for (const item of bastionItems) {
      const list = grouped.get(item.bastionId)
      if (list) list.push(item)
      else grouped.set(item.bastionId, [item])
    }
    return grouped
  }, [bastionItems])

  const itemsForBastion = useCallback(
    (bastionId: string) => bastionItemsByOwner.get(bastionId) ?? [],
    [bastionItemsByOwner]
  )

  const bastionItemSlots = useCallback((item: BastionItem) => {
    const quantity = Math.max(0, item.quantity - item.freeQuantity)
    if (quantity <= 0) return 0
    return Math.ceil(quantity / Math.max(1, item.slotGroupSize)) * item.slotsPerUnit
  }, [])

  const bastionSlotsByOwner = useMemo(() => {
    const totals = new Map<string, number>()
    for (const [bastionId, ownerItems] of bastionItemsByOwner) {
      totals.set(
        bastionId,
        ownerItems.reduce((sum, item) => sum + bastionItemSlots(item), 0)
      )
    }
    return totals
  }, [bastionItemsByOwner, bastionItemSlots])

  const usedBastionSlots = useCallback(
    (bastionId: string) => bastionSlotsByOwner.get(bastionId) ?? 0,
    [bastionSlotsByOwner]
  )

  const dashboardWarnings = useMemo(() => {
    const result = [...expeditionWarnings]

    if (expeditionMembers.length > 0 && expeditionFeedsAvailable < 1) {
      result.push({
        key: 'expedition-food-total',
        severity: 'danger' as const,
        text: `Za mało racji na jedno pełne karmienie ekspedycji: ${totalRations}/${expeditionMembers.length}.`,
      })
    }

    for (const animal of animals) {
      const rations = animalRationCounts.get(animal.id) ?? 0
      if (rations < 1) {
        result.push({
          key: `animal-food-${animal.id}`,
          severity: 'warning' as const,
          text: `${animal.name} (Zwierzę): brak racji — można użyć pastwiska.`,
        })
      }
    }

    if (expeditionLightSeconds <= 0) {
      result.push({
        key: 'light-none',
        severity: 'danger' as const,
        text: 'Brak zapasu światła w całej ekspedycji.',
      })
    } else if (expeditionLightSeconds < 60 * 60) {
      result.push({
        key: 'light-low',
        severity: 'warning' as const,
        text: `Zapas światła ekspedycji spadł poniżej 60 minut: ${formatTimer(expeditionLightSeconds)}.`,
      })
    }

    const fuelKeys = new Set<string>()
    for (const choice of availableLightChoices) {
      const fuel = lightFuelStatusForChoice(choice)
      if (!fuel || fuel.available >= fuel.required) continue

      const key = `${choice.memberType}:${choice.memberId}:${fuel.name}`
      if (fuelKeys.has(key)) continue
      fuelKeys.add(key)

      result.push({
        key: `fuel-${key}`,
        severity: 'warning' as const,
        text: `${choice.memberName}: ${choice.itemName} nie ma wymaganego paliwa (${fuel.name} ${fuel.available}/${fuel.required}).`,
      })
    }

    for (const bastion of bastions) {
      if (!hasVault(bastion.id)) continue
      const used = usedBastionSlots(bastion.id)

      if (used >= 100) {
        result.push({
          key: `vault-full-${bastion.id}`,
          severity: 'danger' as const,
          text: `${bastion.name}: Vault jest pełny (${Number(used.toFixed(2))}/100 slotów).`,
        })
      } else if (used >= 90) {
        result.push({
          key: `vault-near-${bastion.id}`,
          severity: 'warning' as const,
          text: `${bastion.name}: Vault jest prawie pełny (${Number(used.toFixed(2))}/100 slotów).`,
        })
      }
    }

    return result
  }, [
    expeditionWarnings,
    expeditionMembers.length,
    expeditionFeedsAvailable,
    totalRations,
    animals,
    animalRationCounts,
    expeditionLightSeconds,
    availableLightChoices,
    lightFuelStatusForChoice,
    bastions,
    bastionUpgrades,
    bastionItems,
  ])

  function openCharacterShop(characterId: string) {
    setShopCharacterId(characterId)
    setShowCharacterShop(true)
  }

  function openCharacterShopBuy() {
    if (!shopCharacterId) return
    setShowCharacterShop(false)
    openBuyItem('character', shopCharacterId)
  }

  function openCharacterShopSell() {
    if (!shopCharacterId) return
    setShowCharacterShop(false)
    setShowShopSellPicker(true)
  }

  function openBuyItem(ownerType: InventoryOwnerType, ownerId: string) {
    const firstCatalogItem = shopCatalogOptions[0]
    const firstIsRations = isRationCatalogItem(firstCatalogItem)

    setBuyOwnerType(ownerType)
    setBuyOwnerId(ownerId)
    setBuyCatalogItemId(firstCatalogItem?.id ?? '')
    setBuyQuantity(firstIsRations ? 3 : 1)
    setBuyCharacterId(ownerType === 'character' ? ownerId : '')
    setBuyGp(0)
    setBuySp(firstIsRations ? 5 : 0)
    setBuyCp(0)
    setBuyContainerContent('')
    setBuyContainerFill(0)
    setShowBuyItem(true)
  }

  function openSellItem(
    ownerType: InventoryOwnerType,
    item: {
      id: string
      name: string
      quantity: number
      characterId?: string
    }
  ) {
    setSellOwnerType(ownerType)
    setSellItemId(item.id)
    setSellItemName(item.name)
    setSellMaxQuantity(item.quantity)
    setSellQuantity(1)
    setSellCharacterId(
      ownerType === 'character'
        ? item.characterId ?? shopCharacterId
        : ''
    )
    setSellGp(0)
    setSellSp(0)
    setSellCp(0)
    setShowSellItem(true)
  }

  async function refreshInventoryOwners(
    ownerTypes: InventoryOwnerType[],
    refreshCharacterCoins = false
  ) {
    const types = new Set(ownerTypes)
    const jobs: Promise<unknown>[] = []

    if (types.has('character') || refreshCharacterCoins) {
      jobs.push(refreshItems(), refreshCharacters())
    }
    if (types.has('npc')) jobs.push(refreshNpcItems())
    if (types.has('animal')) jobs.push(refreshAnimalItems())
    if (types.has('bastion')) jobs.push(refreshBastionItems())

    await Promise.all(jobs)
  }

  async function executeBuyItem() {
    if (!activeId || !buyOwnerId || !buyCatalogItemId || !buyCharacterId) {
      setError('Wybierz przedmiot do zakupu.')
      return
    }

    const boughtItem = catalog.find(entry => entry.id === buyCatalogItemId)
    const buyingRations = isRationCatalogItem(boughtItem)
    const normalizedBuyQuantity = buyingRations
      ? normalizeRationBuyQuantity(buyQuantity)
      : Math.max(1, buyQuantity)
    const priceCp = buyingRations
      ? rationBuyPriceCp(normalizedBuyQuantity)
      : moneyToCp(buyGp, buySp, buyCp)

    if (
      boughtItem?.category === 'container' &&
      buyOwnerType !== 'character'
    ) {
      setError(
        'Zakup pojemników z zawartością jest obsługiwany w sklepie Postaci.'
      )
      return
    }

    const undoBefore = await captureUndoScopes([
      { table: 'characters', filters: { id: buyCharacterId } },
      inventoryScopeSpec(buyOwnerType, buyOwnerId),
    ])

    setBuyingItem(true)
    try {
      if (boughtItem?.category === 'container') {
        if (!supabase) {
          throw new Error('Supabase nie jest skonfigurowany.')
        }

        const capacity = Math.max(
          0,
          Math.floor(boughtItem.maxUses)
        )
        const normalizedContent =
          buyContainerContent.trim()
        const fill = normalizedContent
          ? Math.max(
              0,
              Math.min(
                capacity,
                Math.floor(buyContainerFill)
              )
            )
          : 0

        const { error: containerBuyError } =
          await supabase.rpc(
            'buy_character_container_item',
            {
              p_campaign_id: activeId,
              p_character_id: buyOwnerId,
              p_buyer_character_id: buyCharacterId,
              p_base_catalog_item_id: buyCatalogItemId,
              p_quantity: normalizedBuyQuantity,
              p_price_cp: priceCp,
              p_content: normalizedContent || null,
              p_fill: fill,
            }
          )

        if (containerBuyError) throw containerBuyError

        await refreshCatalog()
      } else {
        await buyInventoryItem({
          campaignId: activeId,
          ownerType: buyOwnerType,
          ownerId: buyOwnerId,
          buyerCharacterId: buyCharacterId,
          catalogItemId: buyCatalogItemId,
          quantity: normalizedBuyQuantity,
          priceCp,
        })
      }

      const buyer = characters.find(character => character.id === buyCharacterId)
      const targetLabel = inventoryOwnerLabel(buyOwnerType, buyOwnerId)
      const boughtQuantity = normalizedBuyQuantity

      setShowBuyItem(false)
      await refreshInventoryOwners([buyOwnerType], true)
      const undoPayload = await finalizeUndoScopes(undoBefore)
      const purchasedName =
        boughtItem?.category === 'container'
          ? (
              buyContainerContent.trim() &&
              buyContainerFill > 0
                ? `${containerBaseName(
                    boughtItem.name,
                    boughtItem.containerContent
                  )} - ${buyContainerContent.trim()}`
                : containerBaseName(
                    boughtItem.name,
                    boughtItem.containerContent
                  )
            )
          : boughtItem?.name ?? 'przedmiot'

      flash(
        `${buyer?.name ?? 'Postać'} kupił(a) ${boughtQuantity} × ${purchasedName} za ${formatMoneyCp(priceCp)} → ${targetLabel}.`,
        'trade',
        undoPayload
      )
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się kupić przedmiotu.')
    } finally {
      setBuyingItem(false)
    }
  }

  async function executeSellItem() {
    if (!activeId || !sellItemId || !sellCharacterId) {
      setError('Nie udało się ustalić postaci otrzymującej pieniądze.')
      return
    }

    const priceCp = moneyToCp(sellGp, sellSp, sellCp)
    const sourceBefore = inventoryItemContext(sellOwnerType, sellItemId)
    const undoBefore = await captureUndoScopes([
      { table: 'characters', filters: { id: sellCharacterId } },
      ...(sourceBefore
        ? [inventoryScopeSpec(sellOwnerType, sourceBefore.ownerId)]
        : []),
    ])
    setSellingItem(true)
    try {
      await sellInventoryItem({
        campaignId: activeId,
        ownerType: sellOwnerType,
        itemId: sellItemId,
        receiverCharacterId: sellCharacterId,
        quantity: Math.min(sellMaxQuantity, Math.max(1, sellQuantity)),
        priceCp,
      })
      const source = inventoryItemContext(sellOwnerType, sellItemId)
      const receiver = characters.find(character => character.id === sellCharacterId)
      const soldQuantity = Math.min(
        sellMaxQuantity,
        Math.max(1, sellQuantity)
      )

      setShowSellItem(false)
      await refreshInventoryOwners([sellOwnerType], true)
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(
        `${source?.owner ?? 'Ekwipunek'} — sprzedano ${soldQuantity} × ${sellItemName} za ${formatMoneyCp(priceCp)}. Pieniądze otrzymał(a): ${receiver?.name ?? 'Postać'}.`,
        'trade',
        undoPayload
      )
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się sprzedać przedmiotu.')
    } finally {
      setSellingItem(false)
    }
  }

  function bastionTypeFor(bastion: Bastion) {
    return BASTION_TYPES.find(type => type.id === bastion.typeId) ?? BASTION_TYPES[0]
  }

  function upgradesForBastion(bastionId: string) {
    return bastionUpgrades.filter(upgrade => upgrade.bastionId === bastionId)
  }

  function openNewBastion() {
    setBastionName('')
    setBastionOwnerId(characters[0]?.id ?? '')
    setBastionTypeId('house')
    setShowBastion(true)
  }

  async function saveBastion() {
    if (!activeId || !bastionName.trim() || !bastionOwnerId) {
      setError('Podaj nazwę bastionu i właściciela.')
      return
    }

    try {
      await createBastion(activeId, bastionOwnerId, bastionName, bastionTypeId)
      setShowBastion(false)
      flash(`Dodano Bastion: ${bastionName}.`, 'bastion')
      await Promise.all([refreshBastions(), refreshCharacters()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się utworzyć bastionu.')
    }
  }

  async function removeBastion(bastion: Bastion) {
    if (!window.confirm(`Usunąć bastion "${bastion.name}" wraz z ulepszeniami?`)) return
    try {
      const undoBefore = await captureUndoScopes([
        { table: 'bastions', filters: { id: bastion.id } },
        { table: 'bastion_upgrades', filters: { bastion_id: bastion.id } },
        { table: 'bastion_items', filters: { bastion_id: bastion.id } },
      ])
      await deleteBastion(bastion.id)
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(`Usunięto Bastion: ${bastion.name}.`, 'bastion', undoPayload)
      await refreshBastions()
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się usunąć bastionu.')
    }
  }

  function openBastionHp(bastion: Bastion) {
    setEditingBastionHp(bastion)
    setBastionHpValue(bastion.currentHp)
    setShowBastionHp(true)
  }

  async function saveBastionHp() {
    if (!editingBastionHp) return
    try {
      const undoBefore = await captureUndoScopes([
        { table: 'bastions', filters: { id: editingBastionHp.id } },
      ])
      await setBastionHp(editingBastionHp.id, bastionHpValue)
      setShowBastionHp(false)
      setEditingBastionHp(null)
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(
        `${editingBastionHp.name}: ustawiono HP na ${bastionHpValue}/${editingBastionHp.maxHp}.`,
        'bastion',
        undoPayload
      )
      await refreshBastions()
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zmienić HP bastionu.')
    }
  }

  function openBastionRepair(bastion: Bastion) {
    setRepairingBastion(bastion)
    setBastionRepairHp(Math.min(1, Math.max(0, bastion.maxHp - bastion.currentHp)))
    setShowBastionRepair(true)
  }

  async function saveBastionRepair() {
    if (!repairingBastion) return
    try {
      const undoBefore = await captureUndoScopes([
        { table: 'bastions', filters: { id: repairingBastion.id } },
        { table: 'characters', filters: { id: repairingBastion.ownerCharacterId } },
      ])
      const result = await repairBastion(repairingBastion.id, bastionRepairHp)
      setShowBastionRepair(false)
      setRepairingBastion(null)
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(
        `${repairingBastion.name}: naprawiono ${result.repaired} HP za ${result.costGp} GP. Czas: 1 tydzień.`,
        'bastion',
        undoPayload
      )
      await Promise.all([refreshBastions(), refreshCharacters()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się naprawić bastionu.')
    }
  }

  function openBastionUpgrade(bastion: Bastion) {
    const installed = new Set(upgradesForBastion(bastion.id).map(item => item.upgradeId))
    const firstAvailable = BASTION_UPGRADES.find(item => !installed.has(item.id))
    setUpgradingBastion(bastion)
    setBastionUpgradeId(firstAvailable?.id ?? '')
    setShowBastionUpgrade(true)
  }

  async function saveBastionUpgrade() {
    if (!upgradingBastion || !bastionUpgradeId) return
    try {
      await addBastionUpgrade(upgradingBastion.id, bastionUpgradeId)
      setShowBastionUpgrade(false)
      setUpgradingBastion(null)
      flash(`${upgradingBastion.name}: dodano ulepszenie ${bastionUpgradeId}. Budowa trwa 1 tydzień.`, 'bastion')
      await Promise.all([refreshBastions(), refreshCharacters()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się dodać ulepszenia.')
    }
  }

  async function removeInstalledBastionUpgrade(upgrade: BastionUpgrade) {
    if (!window.confirm('Usunąć to ulepszenie z bastionu?')) return
    try {
      await removeBastionUpgrade(upgrade.id)
      flash('Ulepszenie zostało usunięte.')
      await refreshBastions()
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się usunąć ulepszenia.')
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
        flash(`Zaktualizowano Zwierzę: ${animalName}.`, 'animal')
      } else {
        await createAnimal(activeId, animalName, animalType, animalBaseSlots, animalPersonality)
        flash(`Dodano Zwierzę: ${animalName}.`, 'animal')
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
      const undoBefore = await captureUndoScopes([
        { table: 'animals', filters: { id: animal.id } },
        { table: 'animal_items', filters: { animal_id: animal.id } },
      ])
      await deleteAnimal(animal.id)
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(`Usunięto Zwierzę: ${animal.name}.`, 'animal', undoPayload)
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
        flash(
          `${animals.find(animal => animal.id === animalItemAnimalId)?.name ?? 'Zwierzę'} (Zwierzę) — zaktualizowano ${animalItemName}.`,
          'inventory'
        )
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
      const undoBefore = await captureUndoScopes([
        { table: 'animal_items', filters: { id: item.id } },
      ])
      await deleteAnimalItem(item.id)
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(
        isWagonName(item.name)
          ? `${animals.find(animal => animal.id === item.animalId)?.name ?? 'Zwierzę'} (Zwierzę) — odpięto Wóz.`
          : `${animals.find(animal => animal.id === item.animalId)?.name ?? 'Zwierzę'} (Zwierzę) — usunięto ${item.quantity} × ${item.name}.`,
        'inventory',
        undoPayload
      )
      await Promise.all([refreshAnimalItems(), refreshAnimals()])
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się usunąć przedmiotu.')
    }
  }

  function resetStoryCharacterDraft() {
    setStoryCharacterName('')
    setStoryCharacterLocation('')
    setStoryCharacterMeetingTime('')
    setStoryCharacterCircumstances('')
    setStoryCharacterQuest('')
    setStoryCharacterFaction('')
  }

  function openNewStoryCharacter() {
    setEditingStoryCharacter(null)
    resetStoryCharacterDraft()
    setShowStoryCharacter(true)
  }

  function openEditStoryCharacter(character: StoryCharacter) {
    setEditingStoryCharacter(character)
    setStoryCharacterName(character.name)
    setStoryCharacterLocation(character.location)
    setStoryCharacterMeetingTime(character.meetingTime)
    setStoryCharacterCircumstances(character.meetingCircumstances)
    setStoryCharacterQuest(character.quest)
    setStoryCharacterFaction(character.faction)
    setShowStoryCharacter(true)
  }

  async function saveStoryCharacter() {
    if (!activeId || !storyCharacterName.trim()) return

    try {
      const changes = {
        name: storyCharacterName,
        location: storyCharacterLocation,
        meetingTime: storyCharacterMeetingTime,
        meetingCircumstances: storyCharacterCircumstances,
        quest: storyCharacterQuest,
        faction: storyCharacterFaction,
      }

      if (editingStoryCharacter) {
        await updateStoryCharacter(editingStoryCharacter.id, changes)
        flash(`Zaktualizowano Postać Fabularną: ${storyCharacterName}.`, 'other')
      } else {
        await createStoryCharacter(activeId, changes)
        flash(`Dodano Postać Fabularną: ${storyCharacterName}.`, 'other')
      }

      setShowStoryCharacter(false)
      setEditingStoryCharacter(null)
      resetStoryCharacterDraft()
      await refreshStoryCharacters()
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się zapisać Postaci Fabularnej.')
    }
  }

  async function removeStoryCharacter(character: StoryCharacter) {
    const confirmed = window.confirm(
      `Czy na pewno usunąć Postać Fabularną „${character.name}”?`
    )
    if (!confirmed) return

    try {
      const undoBefore = await captureUndoScopes([
        { table: 'story_characters', filters: { id: character.id } },
      ])
      await deleteStoryCharacter(character.id)
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(`Usunięto Postać Fabularną: ${character.name}.`, 'other', undoPayload)
      await refreshStoryCharacters()
    } catch (e: any) {
      setError(e?.message || e?.details || 'Nie udało się usunąć Postaci Fabularnej.')
    }
  }

  const storyCharacterGroups = useMemo(() => {
    const alphabetical = [...storyCharacters].sort((a, b) =>
      a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' })
    )

    const groupLabel = (character: StoryCharacter) => {
      switch (storyCharacterGroupMode) {
        case 'location':
          return character.location.trim() || 'Brak lokalizacji'
        case 'quest':
          return character.quest.trim() || 'Brak zadania'
        case 'time':
          return character.meetingTime.trim() || 'Brak czasu spotkania'
        case 'faction':
          return character.faction.trim() || 'Brak frakcji'
        default:
          return (character.name.trim().charAt(0) || '#').toLocaleUpperCase('pl')
      }
    }

    const grouped = new Map<string, StoryCharacter[]>()
    for (const character of alphabetical) {
      const key = groupLabel(character)
      const list = grouped.get(key)
      if (list) list.push(character)
      else grouped.set(key, [character])
    }

    return [...grouped.entries()].sort(([a], [b]) =>
      a.localeCompare(b, 'pl', { sensitivity: 'base', numeric: true })
    )
  }, [storyCharacters, storyCharacterGroupMode])

  function storyCharacterGroupModeLabel() {
    switch (storyCharacterGroupMode) {
      case 'location': return 'Lokalizacja'
      case 'quest': return 'Zadanie'
      case 'time': return 'Czas spotkania'
      case 'faction': return 'Frakcja'
      default: return 'Alfabetycznie'
    }
  }

  function exportStoryCharactersCsv() {
    if (storyCharacters.length === 0) {
      setError('Brak Postaci Fabularnych do wyeksportowania.')
      return
    }

    const csvEscape = (value: unknown) => {
      const text = String(value ?? '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
      return `"${text.replace(/"/g, '""')}"`
    }

    const rows = [...storyCharacters]
      .sort((a, b) =>
        a.name.localeCompare(b.name, 'pl', {
          sensitivity: 'base',
          numeric: true,
        })
      )
      .map(character => [
        character.name,
        character.location,
        character.meetingTime,
        character.meetingCircumstances,
        character.quest,
        character.faction,
        character.createdAt ?? '',
        character.updatedAt ?? '',
      ])

    const header = [
      'Imię',
      'Lokalizacja',
      'Czas spotkania',
      'Okoliczności spotkania',
      'Zadanie',
      'Frakcja',
      'Utworzono',
      'Ostatnia aktualizacja',
    ]

    const csv =
      '\uFEFF' +
      [header, ...rows]
        .map(row => row.map(csvEscape).join(';'))
        .join('\r\n')

    const campaignName = (active?.name || 'kampania')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'kampania'

    const date = new Date().toISOString().slice(0, 10)
    const filename = `postacie-fabularne-${campaignName}-${date}.csv`

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)

    flash(
      `Wyeksportowano ${storyCharacters.length} ${
        storyCharacters.length === 1 ? 'Postać Fabularną' : 'Postaci Fabularnych'
      } do CSV.`,
      'other'
    )
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
        flash(`Zaktualizowano NPC: ${npcName}.`, 'npc')
      } else {
        await createNpc(activeId, npcName, npcRole, npcMaxSlots)
        flash(`Dodano NPC: ${npcName}.`, 'npc')
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
      flash(`Usunięto NPC: ${npc.name}.`, 'npc')
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
      maxUses: npcItemCatalogItemId
        ? catalog.find(entry => entry.id === npcItemCatalogItemId)?.maxUses ?? 0
        : 0,
    }

    try {
      if (editingNpcItem) {
        await updateNpcItem(editingNpcItem.id, npcItemNpcId, details)
        flash(
          `${npcs.find(npc => npc.id === npcItemNpcId)?.name ?? 'NPC'} (NPC) — zaktualizowano ${npcItemName}.`,
          'inventory'
        )
      } else {
        await createNpcItem({
          campaignId: activeId,
          npcId: npcItemNpcId,
          ...details,
        })
        flash(
          `${npcs.find(npc => npc.id === npcItemNpcId)?.name ?? 'NPC'} (NPC) — dodano ${npcItemQuantity} × ${npcItemName}.`,
          'inventory'
        )
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
      const undoBefore = await captureUndoScopes([
        { table: 'npc_items', filters: { id: item.id } },
      ])
      await deleteNpcItem(item.id, item.npcId)
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(
        `${npcs.find(npc => npc.id === item.npcId)?.name ?? 'NPC'} (NPC) — usunięto ${item.quantity} × ${item.name}.`,
        'inventory',
        undoPayload
      )
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
      parts.push(entry.handsRequired === 2 ? '2 ręce' : '1 ręka')
    }
    if (entry.maxUses > 0) parts.push(`użycia ${entry.maxUses}`)
    if (entry.category === 'armor') {
      if (entry.armorClass) parts.push(`KP/AC ${entry.armorClass}`)
      if (entry.armorProperties) parts.push(entry.armorProperties)
    }
    if (entry.isMagical) parts.push('MAGICZNY')
    if (entry.isQuestItem) parts.push('PRZEDMIOT ZADANIA')
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
      const undoBefore = await captureUndoScopes([
        { table: 'item_catalog', filters: { id: entry.id } },
        { table: 'character_items', filters: { campaign_id: activeId } },
        { table: 'npc_items', filters: { campaign_id: activeId } },
        { table: 'animal_items', filters: { campaign_id: activeId } },
        { table: 'bastion_items', filters: { campaign_id: activeId } },
      ])
      await deleteCatalogItem(entry.id)
      await refreshCatalog()
      const undoPayload = await finalizeUndoScopes(undoBefore)
      flash(`Biblioteka — usunięto: ${entry.name}.`, 'library', undoPayload)
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
        freeQuantityRaw = '0', magicalRaw = 'false', magicDescription = '', questRaw = 'false',
        handsRaw = '1', maxUsesRaw = '0', description = '', containerContent = ''] = cols

      if (!name) throw new Error(`Brak nazwy przedmiotu w wierszu ${index + 1 + start}.`)

      const allowed: CatalogItemCategory[] = ['normal', 'food', 'light', 'weapon', 'armor', 'container']
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
      const isQuestItem = ['1', 'true', 'tak', 'yes'].includes(questRaw.toLowerCase())
      const handsRequired: 1 | 2 =
        category === 'weapon' && Number(handsRaw) === 2 ? 2 : 1
      const maxUses = Math.max(0, Math.floor(Number(maxUsesRaw) || 0))

      return {
        name, category, slotsPerUnit, slotGroupSize, freeQuantity, isMagical, isQuestItem, handsRequired, maxUses,
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
    const header = 'name;category;slots;light_minutes;weapon_damage;weapon_range;weapon_properties;armor_class;armor_properties;slot_group_size;free_quantity;magical;magic_description;quest_item;hands_required;max_uses;description;container_content'
    const rows = catalog.map(entry =>
      [entry.name, entry.category, entry.slotsPerUnit, entry.lightMinutes ?? '',
       entry.weaponDamage ?? '', entry.weaponRange ?? '', entry.weaponProperties ?? '',
       entry.armorClass ?? '', entry.armorProperties ?? '', entry.slotGroupSize, entry.freeQuantity,
       entry.isMagical ? 'true' : 'false', entry.magicDescription ?? '',
       entry.isQuestItem ? 'true' : 'false', entry.handsRequired, entry.maxUses,
       entry.description ?? '', entry.containerContent ?? '']
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
  type UndoScopeSpec = {
    table: string
    filters: Record<string, string | number | boolean | null>
    keyColumns?: string[]
  }

  type UndoDbScope = {
    table: string
    filters: Record<string, string | number | boolean | null>
    keyColumns: string[]
    beforeRows: Record<string, unknown>[]
    afterRows: Record<string, unknown>[]
  }

  async function readUndoScopeRows(
    spec: UndoScopeSpec
  ): Promise<Record<string, unknown>[]> {
    if (!supabase) return []

    let query: any = (supabase as any).from(spec.table).select('*')
    for (const [column, value] of Object.entries(spec.filters)) {
      query = value === null ? query.is(column, null) : query.eq(column, value)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as Record<string, unknown>[]
  }

  async function captureUndoScopes(
    specs: UndoScopeSpec[]
  ): Promise<UndoDbScope[]> {
    return Promise.all(
      specs.map(async spec => ({
        table: spec.table,
        filters: spec.filters,
        keyColumns: spec.keyColumns ?? ['id'],
        beforeRows: await readUndoScopeRows(spec),
        afterRows: [],
      }))
    )
  }

  async function finalizeUndoScopes(
    scopes: UndoDbScope[]
  ): Promise<HistoryUndoPayload> {
    return {
      kind: 'db_restore',
      scopes: await Promise.all(
        scopes.map(async scope => ({
          ...scope,
          afterRows: await readUndoScopeRows({
            table: scope.table,
            filters: scope.filters,
            keyColumns: scope.keyColumns,
          }),
        }))
      ),
    }
  }

  function normalizedUndoRows(
    rows: Record<string, unknown>[],
    keyColumns: string[]
  ) {
    const canonicalize = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map(canonicalize)
      }

      if (
        value !== null &&
        typeof value === 'object'
      ) {
        return Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .sort(([a], [b]) => a.localeCompare(b, 'en'))
            .map(([key, nestedValue]) => [
              key,
              canonicalize(nestedValue),
            ])
        )
      }

      return value
    }

    const normalizeRow = (row: Record<string, unknown>) => {
      const cleaned: Record<string, unknown> = {}

      for (const [key, value] of Object.entries(row)) {
        // Pola techniczne mogą zmieniać się automatycznie przez trigger/RPC
        // i nie oznaczają faktycznej zmiany stanu przez użytkownika.
        if (
          key === 'updated_at' ||
          key === 'created_at' ||
          key === 'used_slots'
        ) {
          continue
        }

        cleaned[key] = canonicalize(value)
      }

      // JSONB może zwracać klucze obiektu w innej kolejności niż SELECT z tabeli.
      // Dlatego przed porównaniem zawsze sortujemy klucze.
      return canonicalize(cleaned) as Record<string, unknown>
    }

    const normalized = rows.map(normalizeRow)

    const keyFor = (row: Record<string, unknown>) =>
      keyColumns.map(column => String(row[column] ?? '')).join('::')

    return normalized.sort((a, b) =>
      keyFor(a).localeCompare(keyFor(b), 'en')
    )
  }

  async function restoreUndoDbScopes(scopes: UndoDbScope[]) {
    if (!supabase) {
      throw new Error('Supabase nie jest skonfigurowany.')
    }

    for (const scope of scopes) {
      const current = await readUndoScopeRows({
        table: scope.table,
        filters: scope.filters,
        keyColumns: scope.keyColumns,
      })

      if (
        JSON.stringify(normalizedUndoRows(current, scope.keyColumns)) !==
        JSON.stringify(normalizedUndoRows(scope.afterRows, scope.keyColumns))
      ) {
        throw new Error(
          `Nie można bezpiecznie cofnąć zmiany: stan danych w ${scope.table} faktycznie różni się od zapisanego stanu po operacji.`
        )
      }
    }

    for (const scope of scopes) {
      const beforeKeys = new Set(
        scope.beforeRows.map(row =>
          scope.keyColumns
            .map(column => String(row[column] ?? ''))
            .join('::')
        )
      )

      const currentRows = await readUndoScopeRows({
        table: scope.table,
        filters: scope.filters,
        keyColumns: scope.keyColumns,
      })

      for (const row of currentRows) {
        const key = scope.keyColumns
          .map(column => String(row[column] ?? ''))
          .join('::')

        if (beforeKeys.has(key)) continue

        let deleteQuery: any = (supabase as any).from(scope.table).delete()
        for (const column of scope.keyColumns) {
          deleteQuery = deleteQuery.eq(column, row[column])
        }
        const { error } = await deleteQuery
        if (error) throw error
      }

      for (const row of scope.beforeRows) {
        const rowKey = scope.keyColumns
          .map(column => String(row[column] ?? ''))
          .join('::')

        const existingRow = currentRows.find(candidate => {
          const candidateKey = scope.keyColumns
            .map(column => String(candidate[column] ?? ''))
            .join('::')
          return candidateKey === rowKey
        })

        if (existingRow) {
          // Jeżeli rekord nadal istnieje, wykonujemy zwykły UPDATE.
          // To jest ważne m.in. dla tabeli characters: UPSERT wymagał także
          // polityki INSERT i powodował błąd RLS podczas cofania sprzedaży.
          let updateQuery: any = (supabase as any)
            .from(scope.table)
            .update(row)

          for (const column of scope.keyColumns) {
            updateQuery = updateQuery.eq(column, row[column])
          }

          const { error } = await updateQuery
          if (error) throw error
        } else {
          // INSERT jest potrzebny wyłącznie wtedy, gdy cofamy operację,
          // która faktycznie usunęła rekord.
          const { error } = await (supabase as any)
            .from(scope.table)
            .insert(row)

          if (error) throw error
        }
      }
    }
  }

  function inventoryScopeSpec(
    ownerType: InventoryOwnerType,
    ownerId: string
  ): UndoScopeSpec {
    if (ownerType === 'character') {
      return { table: 'character_items', filters: { character_id: ownerId } }
    }
    if (ownerType === 'npc') {
      return { table: 'npc_items', filters: { npc_id: ownerId } }
    }
    if (ownerType === 'animal') {
      return { table: 'animal_items', filters: { animal_id: ownerId } }
    }
    return { table: 'bastion_items', filters: { bastion_id: ownerId } }
  }

  function valuesMatch(
    current: Record<string, unknown>,
    expected: Record<string, unknown>
  ) {
    return Object.entries(expected).every(
      ([key, value]) => JSON.stringify(current[key]) === JSON.stringify(value)
    )
  }

  async function undoHistoryEntry(entry: HistoryEntry) {
    if (!entry.undoPayload || entry.undoneAt || !activeId) return

    if (
      !window.confirm(
        `Cofnąć tę zmianę?\n\n${entry.message}\n\nOperacja zostanie wykonana tylko, jeśli dane nie zostały później zmienione w tym samym miejscu.`
      )
    ) {
      return
    }

    setUndoingHistoryId(entry.id)

    try {
      const payload = entry.undoPayload

      if (payload.kind === 'character_patch') {
        const character = characters.find(
          candidate => candidate.id === payload.characterId
        )

        if (!character) {
          throw new Error('Nie znaleziono Postaci, której dotyczy ta zmiana.')
        }

        const current = characterHistorySnapshot(character)

        if (!valuesMatch(current, payload.after)) {
          throw new Error(
            'Nie można bezpiecznie cofnąć tej zmiany, ponieważ te dane Postaci zostały później zmodyfikowane.'
          )
        }

        const restored = {
          ...current,
          ...payload.before,
        } as ReturnType<typeof characterHistorySnapshot>

        await updateCharacter(character.id, restored)
        await refreshCharacters()
      } else if (payload.kind === 'inventory_quantity') {
        const context = inventoryItemContext(
          payload.ownerType,
          payload.itemId
        )

        if (!context) {
          throw new Error(
            'Nie znaleziono przedmiotu. Nie można cofnąć tej zmiany.'
          )
        }

        if (context.oldQuantity !== payload.after) {
          throw new Error(
            'Nie można bezpiecznie cofnąć tej zmiany, ponieważ ilość przedmiotu została później zmodyfikowana.'
          )
        }

        await setInventoryItemQuantity({
          campaignId: activeId,
          ownerType: payload.ownerType,
          itemId: payload.itemId,
          quantity: payload.before,
        })

        await refreshInventoryOwners(
          [payload.ownerType],
          payload.ownerType === 'character'
        )
      } else if (payload.kind === 'character_item_flag') {
        const item = items.find(candidate => candidate.id === payload.itemId)

        if (!item) {
          throw new Error(
            'Nie znaleziono przedmiotu Postaci. Nie można cofnąć tej zmiany.'
          )
        }

        const current =
          payload.flag === 'quickpull'
            ? item.isQuickpull
            : item.isEquipped

        if (current !== payload.after) {
          throw new Error(
            'Nie można bezpiecznie cofnąć tej zmiany, ponieważ stan przedmiotu został później zmodyfikowany.'
          )
        }

        if (payload.flag === 'quickpull') {
          await setCharacterItemQuickpull(payload.itemId, payload.before)
        } else {
          await setCharacterItemEquipped(payload.itemId, payload.before)
        }

        await refreshItems()
      } else if (payload.kind === 'db_restore') {
        await restoreUndoDbScopes(payload.scopes)
        await Promise.all([
          refreshCharacters(),
          refreshItems(),
          refreshNpcs(),
          refreshNpcItems(),
          refreshAnimals(),
          refreshAnimalItems(),
          refreshBastions(),
          refreshBastionItems(),
          refreshCatalog(),
          refreshStoryCharacters(),
          loadCampaignLight(activeId).then(setLightState),
        ])
      } else if (payload.kind === 'catalog_restore') {
        const entryNow = catalog.find(
          candidate => candidate.id === payload.catalogItemId
        )

        if (!entryNow) {
          throw new Error(
            'Nie znaleziono pozycji Biblioteki. Nie można cofnąć tej zmiany.'
          )
        }

        const current = catalogHistorySnapshot(entryNow)

        if (!valuesMatch(current, payload.after)) {
          throw new Error(
            'Nie można bezpiecznie cofnąć tej zmiany, ponieważ pozycja Biblioteki została później ponownie edytowana.'
          )
        }

        await updateCatalogItem(
          payload.catalogItemId,
          payload.before as Parameters<typeof updateCatalogItem>[1]
        )
        await refreshCatalog()
      }

      await markCampaignHistoryUndone(entry.id)
      await addCampaignHistory(
        activeId,
        entry.eventType,
        `Cofnięto zmianę: ${entry.message}`
      )
      await refreshHistory()
      setMessage('Zmiana została cofnięta.')
      window.setTimeout(() => setMessage(null), 3000)
    } catch (e: any) {
      const rawMessage = e?.message || e?.details || ''
      setError(
        rawMessage.includes('row-level security')
          ? `Nie udało się cofnąć zmiany z powodu polityki RLS: ${rawMessage}`
          : rawMessage || 'Nie udało się cofnąć zmiany.'
      )
    } finally {
      setUndoingHistoryId(null)
    }
  }

  const filteredHistory = useMemo(
    () =>
      historyFilter === 'all'
        ? history
        : history.filter(entry => entry.eventType === historyFilter),
    [history, historyFilter]
  )

  function historyTypeLabel(type: HistoryEventType) {
    switch (type) {
      case 'inventory': return 'Ekwipunek'
      case 'trade': return 'Handel'
      case 'light': return 'Światło'
      case 'food': return 'Prowiant'
      case 'character': return 'Postać'
      case 'npc': return 'NPC'
      case 'animal': return 'Zwierzę'
      case 'bastion': return 'Bastion'
      case 'library': return 'Biblioteka'
      default: return 'Inne'
    }
  }

  function formatHistoryTime(value: string) {
    const date = new Date(value)
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
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
            <button
              className="secondary full"
              onClick={() => setShowBackupMenu(true)}
              disabled={!activeId}
              title="Zapisz bieżący stan kampanii do pliku JSON"
            >
              <Save size={16} />
              Kopia zapasowa
            </button>

          <nav>
            {nav.map(([label, Icon]) => (
              <div key={label}>
                <button
                  className={activeView === label ? 'nav-active' : ''}
                  onClick={() => {
                    if (label === 'Postacie') {
                      setActiveView('Postacie')
                      setMobileNav(false)
                    } else {
                      setActiveView(label)
                      setMobileNav(false)
                    }
                  }}
                >
                  <Icon size={17} />
                  {label}
                </button>

                {label === 'Postacie' && activeView === 'Postacie' && (
                  <div
                    style={{
                      display: 'grid',
                      gap: 3,
                      margin: '4px 0 8px 22px',
                      paddingLeft: 9,
                      borderLeft: '1px solid rgba(180, 135, 60, 0.35)',
                    }}
                  >
                    {sortedCharacters.map(character => (
                      <button
                        key={character.id}
                        onClick={() => openCharacterCard(character.id)}
                        style={{
                          minHeight: 30,
                          padding: '5px 9px',
                          justifyContent: 'flex-start',
                          fontSize: 13,
                          color:
                            selectedCharacterId === character.id
                              ? '#f0cf83'
                              : '#bda77b',
                          background:
                            selectedCharacterId === character.id
                              ? 'rgba(143, 101, 36, 0.18)'
                              : 'transparent',
                          border:
                            selectedCharacterId === character.id
                              ? '1px solid rgba(174, 126, 49, 0.42)'
                              : '1px solid transparent',
                          borderRadius: 5,
                        }}
                      >
                        {character.name}
                      </button>
                    ))}

                    <button
                      onClick={openAllCharacters}
                      style={{
                        minHeight: 30,
                        padding: '5px 9px',
                        justifyContent: 'flex-start',
                        fontSize: 13,
                        fontWeight: 700,
                        color: selectedCharacterId === null ? '#f0cf83' : '#bda77b',
                        background:
                          selectedCharacterId === null
                            ? 'rgba(143, 101, 36, 0.18)'
                            : 'transparent',
                        border:
                          selectedCharacterId === null
                            ? '1px solid rgba(174, 126, 49, 0.42)'
                            : '1px solid transparent',
                        borderRadius: 5,
                      }}
                    >
                      Wszystkie
                    </button>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <Home size={16} />

            <span>
              Etap MAP-1 • kalibracja mapy</span>
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
              value={String(activeCharacters.length)}
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
              label="Majątek postaci"
              value={`${charactersWealth.toLocaleString('pl-PL')} gp`}
              sub="złoto zapisane przy postaciach"
            />

            <Metric
              icon={<Coins />}
              label="Majątek ekspedycji"
              value={`${expeditionGold.toLocaleString('pl-PL')} gp`}
              sub="postacie + NPC + zwierzęta"
            />

            <Metric
              icon={<Coins />}
              label="Majątek całkowity"
              value={`${totalWealth.toLocaleString('pl-PL')} gp`}
              sub={
                bastionCoins > 0
                  ? `w tym ${bastionCoins.toLocaleString('pl-PL')} gp w Vault`
                  : 'łącznie z bastionami'
              }
            />

          </section>

          <section className="dashboard-grid">

            <div className="panel wide">
              <div className="panel-title">
                <Shield size={18} />
                Ostrzeżenia ekspedycji
                <span style={{ marginLeft: 'auto' }}>{dashboardWarnings.length}</span>
              </div>

              {dashboardWarnings.length === 0 ? (
                <p className="muted">Brak ostrzeżeń dla ekspedycji.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {dashboardWarnings.map(warning => (
                    <div key={warning.key} className="setup-banner">
                      <Shield size={16} />
                      <div>
                        <strong>{warning.severity === 'danger' ? 'UWAGA' : 'OSTRZEŻENIE'}</strong>
                        <span>{warning.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className="panel wide"
              style={{
                borderColor: 'rgba(210, 122, 39, 0.58)',
                background:
                  'linear-gradient(135deg, rgba(117, 62, 22, 0.13), rgba(39, 28, 19, 0.08))',
              }}
            >
              <div className="panel-title">
                <Package size={18} />
                Przedmioty zadania
                <span style={{ marginLeft: 'auto' }}>{questItemSummary.length}</span>
              </div>

              {questItemSummary.length === 0 ? (
                <p className="muted">Brak oznaczonych przedmiotów zadania.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {questItemSummary.map(group => (
                    <div
                      key={group.key}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(210, 122, 39, 0.52)',
                        background: 'rgba(151, 76, 22, 0.12)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 16,
                          alignItems: 'center',
                        }}
                      >
                        <strong style={{ color: '#e4a059' }}>
                          {group.name}
                        </strong>
                        <span className="muted">Łącznie: {group.total}</span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '5px 14px',
                          marginTop: 6,
                        }}
                      >
                        {group.owners.map(owner => (
                          <span key={owner.key} className="muted">
                            <b style={{ color: '#d8bd8c' }}>{owner.owner}</b>
                            {' • '}{owner.ownerType} × {owner.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

<section
            className="panel wide"
            style={{
              marginTop: 18,
              minHeight: 150,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              background:
                `linear-gradient(90deg, rgba(12,9,5,.96), rgba(12,9,5,.48)), url(${import.meta.env.BASE_URL}treasure-chest.jpg) center / cover no-repeat`,
            }}
            onClick={() => setActiveView('Skrzynia ze skarbami')}
          >
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 620, padding: '8px 14px' }}>
              <p className="eyebrow">NIEPODZIELONE ŁUPY</p>
              <h2 style={{ margin: '2px 0 6px' }}>Skrzynia ze skarbami</h2>
              <p>Przechowuj zdobyte skarby, zanim zostaną rozdzielone pomiędzy żywych członków drużyny.</p>
              <strong>{treasureItems.reduce((sum, item) => sum + item.quantity, 0)} przedmiotów</strong>
            </div>
          </section>




            <div
              className="panel light-panel"
              style={{
                position: 'relative',
                overflow: 'hidden',
                paddingLeft: 235,
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}dashboard-torch.png`}
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 200,
                  maxHeight: '88%',
                  objectFit: 'contain',
                  borderRadius: 8,
                  border: '1px solid rgba(197, 148, 58, 0.34)',
                  boxShadow: '0 6px 18px rgba(0,0,0,.34)',
                  pointerEvents: 'none',
                }}
              />

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
                        style={themedSelectStyle}
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
                      style={themedSelectStyle}
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
                      style={themedSelectStyle}
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

            <div
              className="panel"
              style={{
                position: 'relative',
                overflow: 'hidden',
                paddingRight: 255,
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}dashboard-camp.png`}
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 225,
                  maxHeight: '88%',
                  objectFit: 'contain',
                  borderRadius: 8,
                  border: '1px solid rgba(197, 148, 58, 0.34)',
                  boxShadow: '0 6px 18px rgba(0,0,0,.34)',
                  pointerEvents: 'none',
                }}
              />

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
                        style={themedSelectStyle}
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
              ) : activeCharacters.length === 0 ? (
                <div className="empty-state">
                  <p>W tej kampanii nie ma jeszcze żadnych postaci.</p>
                  <button className="primary" onClick={openNewCharacter}>
                    <Plus size={16} />
                    Dodaj pierwszą postać
                  </button>
                </div>
              ) : (
                <div className="entity-grid">
                  {activeCharacters.map(character => {
                    const maxSlots = Math.max(10, character.strength) + Math.max(0, character.bonusSlots)
                    const usedSlots = usedSlotsForCharacter(character.id)
                    const displayedUsedSlots = Number(usedSlots.toFixed(2))

                    return (
                      <article
                        className="entity-card"
                        key={character.id}
                        onClick={() => openCharacterCard(character.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openCharacterCard(character.id)
                          }
                        }}
                        title={`Otwórz kartę: ${character.name}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="entity-head">
                          <button
                            type="button"
                            onClick={() => openCharacterCard(character.id)}
                            title={`Otwórz kartę: ${character.name}`}
                            style={{
                              padding: 0,
                              border: 0,
                              background: 'transparent',
                              color: '#ead09a',
                              font: 'inherit',
                              fontWeight: 800,
                              cursor: 'pointer',
                              textAlign: 'left',
                              textDecoration: 'underline',
                              textDecorationColor: 'rgba(207, 162, 77, 0.42)',
                              textUnderlineOffset: 3,
                            }}
                          >
                            {character.name}
                          </button>
                          <span>Postać</span>
                        </div>

                        <div className="slot-line">
                          <span>HP</span>
                          <b>
                            {character.currentHp}/{effectiveMaxHp(character)}
                            {character.temporaryHp > 0
                              ? ` (+${character.temporaryHp} tymcz.)`
                              : ''}
                          </b>
                        </div>

                        <div className="slot-line" style={{ marginTop: 8 }}>
                          <span>AC</span>
                          <b>{armorClassForCharacter(character)}</b>
                        </div>

                        <div className="slot-line" style={{ marginTop: 8 }}>
                          <span>W rękach</span>
                          <b>{handsDisplayForCharacter(character.id)}</b>
                        </div>

                        <div className="slot-line" style={{ marginTop: 8 }}>
                          <span>Sloty</span>
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

                        <div
                          className="button-row"
                          onClick={event => event.stopPropagation()}
                        >
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
                    {selectedCharacter
                      ? `Wyodrębniona karta: ${selectedCharacter.name}.`
                      : 'Postacie, złoto i ekwipunek aktywnej kampanii.'}
                    {' '}Zmiany synchronizują się między użytkownikami.
                  </p>
                </div>

                <div className="button-row">
                  {selectedCharacterId && (
                    <button
                      className="secondary"
                      onClick={openAllCharacters}
                    >
                      <Users size={16} />
                      Wszystkie
                    </button>
                  )}

                  <button
                    className="primary"
                    onClick={openNewCharacter}
                    disabled={!activeId}
                  >
                    <Plus size={16} />
                    Nowa postać
                  </button>
                </div>
              </section>

              <section className="dashboard-grid">
                <div className="panel wide">
                  <div className="panel-title">
                    <Users size={18} />
                    Postacie i ekwipunek
                  </div>

                  {charactersLoading || itemsLoading ? (
                    <p className="muted">Ładowanie danych…</p>
                  ) : activeCharacters.length === 0 ? (
                    <div className="empty-state">
                      <p>W tej kampanii nie ma jeszcze żadnych postaci.</p>
                      <button className="primary" onClick={openNewCharacter}>
                        <Plus size={16} />
                        Dodaj pierwszą postać
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                      {selectedCharacter && (() => {
                      const character = selectedCharacter
                      const maxSlots = Math.max(10, character.strength) + Math.max(0, character.bonusSlots)
                      const usedSlots = usedSlotsForCharacter(character.id)
                      const characterItems = itemsForCharacter(character.id)
                      const weapon = equippedWeaponForCharacter(character.id)
                      const shield = equippedShieldForCharacter(character.id)
                      const light = activeLightForCharacter(character.id)
                      const handsUsed =
                        (weapon ? weaponHandsRequired(weapon) : 0) +
                        (shield ? 1 : 0) +
                        (light ? 1 : 0)

                      const sheetPanel = {
                        border: '1px solid rgba(180, 135, 60, 0.34)',
                        borderRadius: 8,
                        background:
                          'linear-gradient(180deg, rgba(45, 35, 22, 0.50), rgba(18, 16, 13, 0.88))',
                      } as const

                      const fieldBox = {
                        border: '1px solid rgba(180, 135, 60, 0.30)',
                        borderRadius: 6,
                        padding: '7px 10px',
                        background: 'rgba(12, 11, 9, 0.68)',
                      } as const

                      return (
                        <article
                          key={`sheet-${character.id}`}
                          style={{
                            ...sheetPanel,
                            padding: 14,
                            marginBottom: 16,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 12,
                              alignItems: 'center',
                              marginBottom: 12,
                            }}
                          >
                            <button
                              className="secondary"
                              onClick={openAllCharacters}
                            >
                              ← Wszystkie postacie
                            </button>

                            <div className="button-row">
                              <button
                                className="secondary"
                                onClick={() => openEditCharacter(character)}
                              >
                                <Pencil size={15} />
                                Edytuj kartę
                              </button>

                              <button
                                className="secondary"
                                onClick={() => openDeathCharacter(character)}
                                style={{ color: '#b9b2a5' }}
                              >
                                <Skull size={15} />
                                Martwy
                              </button>

                              <button
                                className="danger"
                                onClick={() => removeCharacter(character)}
                              >
                                <Trash2 size={15} />
                                Usuń postać
                              </button>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                '220px minmax(360px, 1.45fr) minmax(240px, 0.9fr)',
                              gap: 12,
                              alignItems: 'stretch',
                            }}
                          >
                            <div style={{ ...sheetPanel, padding: 8 }}>
                              <div
                                style={{
                                  aspectRatio: '4 / 5',
                                  border: '1px solid rgba(197, 148, 58, 0.58)',
                                  borderRadius: 7,
                                  overflow: 'hidden',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'rgba(9, 9, 8, 0.85)',
                                }}
                              >
                                {character.portraitUrl ? (
                                  <img
                                    src={character.portraitUrl}
                                    alt={`Portret ${character.name}`}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="muted"
                                    style={{ textAlign: 'center', padding: 16 }}
                                  >
                                    <Users size={38} />
                                    <div style={{ marginTop: 8 }}>PORTRET</div>
                                  </div>
                                )}
                              </div>

                              <label
                                className="secondary"
                                style={{
                                  display: 'flex',
                                  marginTop: 8,
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                }}
                              >
                                <Users size={15} />
                                Zmień portret
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  style={{ display: 'none' }}
                                  onChange={e => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      void uploadCharacterPortrait(character, file)
                                    }
                                    e.currentTarget.value = ''
                                  }}
                                />
                              </label>
                              <div
                                className="muted"
                                style={{
                                  textAlign: 'center',
                                  fontSize: 11,
                                  marginTop: 5,
                                }}
                              >
                                PNG / JPG / WEBP • maks. 5 MB
                              </div>

                              <div
                                style={{
                                  marginTop: 10,
                                  display: 'grid',
                                  gap: 5,
                                }}
                              >
                                <div style={{ ...fieldBox, padding: '6px 8px' }}>
                                  <span className="muted" style={{ fontSize: 9 }}>IMIĘ</span>
                                  <strong style={{ display: 'block', marginTop: 2 }}>
                                    {character.name || '—'}
                                  </strong>
                                </div>
                                <div style={{ ...fieldBox, padding: '6px 8px' }}>
                                  <span className="muted" style={{ fontSize: 9 }}>TYTUŁ • POZIOM</span>
                                  <strong style={{ display: 'block', marginTop: 2 }}>
                                    {character.title || '—'} • {character.level}
                                  </strong>
                                </div>
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 5,
                                  }}
                                >
                                  <div style={{ ...fieldBox, padding: '6px 8px' }}>
                                    <span className="muted" style={{ fontSize: 9 }}>ANCESTRY</span>
                                    <strong style={{ display: 'block', marginTop: 2, fontSize: 12 }}>
                                      {character.ancestry || '—'}
                                    </strong>
                                  </div>
                                  <div style={{ ...fieldBox, padding: '6px 8px' }}>
                                    <span className="muted" style={{ fontSize: 9 }}>KLASA</span>
                                    <strong style={{ display: 'block', marginTop: 2, fontSize: 12 }}>
                                      {character.className || '—'}
                                    </strong>
                                  </div>
                                </div>
                                <div
                                  className="muted"
                                  style={{
                                    fontSize: 10,
                                    lineHeight: 1.35,
                                    padding: '2px 3px',
                                  }}
                                >
                                  {character.alignment || '—'} • {character.background || '—'}
                                  {character.deity ? ` • ${character.deity}` : ''}
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                ...sheetPanel,
                                padding: 12,
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <div
                                className="panel-title"
                                style={{ marginBottom: 10, fontSize: 16 }}
                              >
                                STATYSTYKI
                              </div>

                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                  gap: 9,
                                  flex: 1,
                                }}
                              >
                                {[
                                  ['STR', character.strength],
                                  ['DEX', character.dexterity],
                                  ['CON', character.constitution],
                                  ['INT', character.intelligence],
                                  ['WIS', character.wisdom],
                                  ['CHA', character.charisma],
                                ].map(([label, value]) => (
                                  <div
                                    key={String(label)}
                                    style={{
                                      ...fieldBox,
                                      minHeight: 94,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      textAlign: 'center',
                                      borderColor: 'rgba(197, 148, 58, 0.52)',
                                      background:
                                        'linear-gradient(180deg, rgba(105, 76, 31, 0.18), rgba(12, 11, 9, 0.72))',
                                    }}
                                  >
                                    <strong
                                      style={{
                                        fontSize: 16,
                                        letterSpacing: 1.2,
                                        color: '#d9b66f',
                                      }}
                                    >
                                      {label}
                                    </strong>
                                    <strong
                                      style={{
                                        display: 'block',
                                        marginTop: 5,
                                        fontSize: 30,
                                        lineHeight: 1,
                                      }}
                                    >
                                      {value}
                                    </strong>
                                    <strong
                                      style={{
                                        display: 'block',
                                        marginTop: 6,
                                        fontSize: 18,
                                      }}
                                    >
                                      {formatModifier(statModifier(Number(value)))}
                                    </strong>
                                  </div>
                                ))}
                              </div>

                              <div style={{ ...fieldBox, marginTop: 9 }}>
                                <span className="muted">QUICKPULL (DEX)</span>
                                <strong style={{ float: 'right' }}>
                                  {quickpullCount(character.id)}/{quickpullLimit(character)}
                                </strong>
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateRows: 'auto auto auto',
                                gap: 9,
                              }}
                            >
                              <div
                                style={{
                                  ...sheetPanel,
                                  padding: '13px 14px',
                                  borderColor: 'rgba(164, 69, 54, 0.72)',
                                  background:
                                    'linear-gradient(180deg, rgba(105, 38, 32, 0.22), rgba(18, 16, 13, 0.92))',
                                }}
                              >
                                <span className="muted" style={{ letterSpacing: 1 }}>
                                  HP CAŁKOWITE
                                </span>
                                <strong
                                  style={{
                                    display: 'block',
                                    marginTop: 4,
                                    fontSize: 34,
                                    lineHeight: 1,
                                  }}
                                >
                                  {character.currentHp}/{effectiveMaxHp(character)}
                                </strong>

                                <div style={{ marginTop: 10 }}>
                                  {hpCalculatorControl(character)}
                                </div>

                                <div
                                  style={{
                                    marginTop: 10,
                                    paddingTop: 9,
                                    borderTop: '1px solid rgba(164, 69, 54, 0.30)',
                                  }}
                                >
                                  <span className="muted" style={{ display: 'block', marginBottom: 5 }}>
                                    Tymczasowe HP
                                  </span>
                                  <InventoryQuantityInput
                                    value={character.temporaryHp}
                                    onCommit={value =>
                                      setCharacterTemporaryHpValue(character, value)
                                    }
                                  />
                                  <span
                                    className="muted"
                                    style={{ display: 'block', marginTop: 5, fontSize: 11 }}
                                  >
                                    Bazowe max: {character.maxHp} • efektywne max:{' '}
                                    {effectiveMaxHp(character)}
                                  </span>
                                </div>
                              </div>

                              <div
                                style={{
                                  ...sheetPanel,
                                  padding: '13px 14px',
                                  borderColor: 'rgba(75, 118, 153, 0.72)',
                                  background:
                                    'linear-gradient(180deg, rgba(38, 67, 96, 0.20), rgba(18, 16, 13, 0.92))',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'baseline',
                                    gap: 8,
                                  }}
                                >
                                  <span className="muted" style={{ letterSpacing: 1 }}>XP</span>
                                  <strong style={{ fontSize: 28 }}>
                                    {character.xp} / {character.xpNext}
                                  </strong>
                                </div>
                                <div style={{ marginTop: 10 }}>
                                  {xpCalculatorControl(character)}
                                </div>
                              </div>

                              <div
                                style={{
                                  ...sheetPanel,
                                  padding: '10px 12px',
                                  display: 'grid',
                                  gap: 8,
                                }}
                              >
                                <div className="slot-line">
                                  <span>AC</span>
                                  <b style={{ fontSize: 20 }}>
                                    {armorClassForCharacter(character)}
                                  </b>
                                </div>
                                <div className="slot-line">
                                  <span>W rękach</span>
                                  <b>{handsDisplayForCharacter(character.id)}</b>
                                </div>
                                <div className="slot-line">
                                  <span>Ręce</span>
                                  <b>{handsUsed}/2</b>
                                </div>
                                <div className="slot-line">
                                  <span>Sloty</span>
                                  <b>{Number(usedSlots.toFixed(2))}/{maxSlots}</b>
                                </div>
                                <div
                                  style={{
                                    marginTop: 6,
                                    paddingTop: 8,
                                    borderTop: '1px solid rgba(180, 135, 60, 0.24)',
                                  }}
                                >
                                  <span className="muted" style={{ display: 'block', marginBottom: 5 }}>
                                    Bonusowe sloty
                                  </span>
                                  <InventoryQuantityInput
                                    value={character.bonusSlots}
                                    onCommit={value =>
                                      setCharacterBonusSlotsValue(character, value)
                                    }
                                  />
                                  <span className="muted" style={{ display: 'block', marginTop: 5, fontSize: 11 }}>
                                    Fighter: możesz wpisać tutaj modyfikator CON ({formatModifier(statModifier(character.constitution))}).
                                  </span>
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
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                'repeat(2, minmax(0, 1fr))',
                              gap: 12,
                              marginTop: 12,
                            }}
                          >
                            <section style={{ ...sheetPanel, padding: 12 }}>
                              <div
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          right: 54,
                          top: 32,
                          width: 72,
                          height: 72,
                          borderRadius: '50%',
                          border: '4px double #b98535',
                          background: 'radial-gradient(circle, #dbc07d 0 46%, #8b6026 47% 58%, #2b190c 59%)',
                          boxShadow: '0 7px 15px rgba(0,0,0,.65)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#3a220d',
                          fontFamily: 'Georgia, serif',
                          fontWeight: 900,
                          fontSize: 27,
                          zIndex: 2,
                        }}
                      >
                        ✦
                      </div>
                      <div className="panel-title">
                                TALENTY / ZAKLĘCIA / JĘZYKI / BIEGŁOŚCI
                              </div>
                              <div
                                style={{
                                  ...fieldBox,
                                  minHeight: 190,
                                  whiteSpace: 'pre-wrap',
                                  lineHeight: 1.45,
                                }}
                              >
                                {character.talentsSpells || '—'}
                              </div>
                            </section>

                            <section style={{ ...sheetPanel, padding: 12 }}>
                              <div className="panel-title">
                                HISTORIA POSTACI
                              </div>
                              <div
                                style={{
                                  ...fieldBox,
                                  minHeight: 190,
                                  whiteSpace: 'pre-wrap',
                                  lineHeight: 1.5,
                                }}
                              >
                                {character.backstory || '—'}
                              </div>
                            </section>
                          </div>

                          <section
                            style={{
                              ...sheetPanel,
                              padding: 12,
                              marginTop: 12,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10,
                                marginBottom: 10,
                              }}
                            >
                              <div className="panel-title" style={{ margin: 0 }}>
                                EKWIPUNEK
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  width: '100%',
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => openCharacterShop(character.id)}
                                  title={`Otwórz sklep dla: ${character.name}`}
                                  style={{
                                    width: 'min(100%, 360px)',
                                    padding: 0,
                                    overflow: 'hidden',
                                    borderRadius: 12,
                                    border: '1px solid rgba(197, 148, 58, 0.78)',
                                    background: 'rgba(15, 13, 10, 0.95)',
                                    boxShadow:
                                      'inset 0 0 0 1px rgba(225, 184, 94, 0.10), 0 5px 18px rgba(0,0,0,.34)',
                                    cursor: 'pointer',
                                    color: '#ead09a',
                                  }}
                                >
                                  <img
                                    src={`${import.meta.env.BASE_URL}fantasy-shop.png`}
                                    alt="Fantasy sklep"
                                    style={{
                                      display: 'block',
                                      width: '100%',
                                      aspectRatio: '3 / 2',
                                      objectFit: 'cover',
                                      borderBottom:
                                        '1px solid rgba(197, 148, 58, 0.48)',
                                    }}
                                  />
                                  <span
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 9,
                                      padding: '10px 14px 11px',
                                      fontWeight: 900,
                                      fontSize: 18,
                                      letterSpacing: 1.1,
                                      fontFamily: 'Georgia, serif',
                                    }}
                                  >
                                    <Building2 size={20} />
                                    SKLEP
                                    <Coins size={17} />
                                  </span>
                                </button>
                              </div>
                            </div>

                            {characterItems.length === 0 ? (
                              <p className="muted">Brak przedmiotów.</p>
                            ) : (
                              <div style={{ display: 'grid', gap: 7 }}>
                                {sortInventoryForDisplay(characterItems).map(
                                  item => (
                                    <div
                                      key={`sheet-item-${item.id}`}
                                      className="slot-line"
                                      style={{
                                        ...inventoryHighlightStyle(
                                          item.category,
                                          isMagicalInventoryItem(
                                            item.catalogItemId
                                          ),
                                          isQuestInventoryItem(
                                            item.catalogItemId
                                          )
                                        ),
                                        ...(item.isEquipped
                                          ? {
                                              border:
                                                '1px solid rgba(80, 146, 76, 0.95)',
                                              boxShadow:
                                                'inset 0 0 0 1px rgba(127, 187, 108, 0.12)',
                                            }
                                          : {}),
                                        ...(item.isQuickpull
                                          ? {
                                              outline:
                                                '2px solid rgba(218, 183, 103, 0.95)',
                                              outlineOffset: '2px',
                                            }
                                          : {}),
                                      }}
                                    >
                                      <span>
                                        {inventoryCategoryMarker(item)}
                                        {(item.isEquipped ||
                                          item.isActiveLight) && (
                                          <span
                                            title="Wyposażone / trzymane"
                                            style={{
                                              width: 21,
                                              height: 21,
                                              minWidth: 21,
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              borderRadius: 5,
                                              marginRight: 7,
                                              color: '#8fbe7d',
                                              border:
                                                '1px solid rgba(83, 145, 76, 0.62)',
                                              background:
                                                'rgba(55, 100, 49, 0.17)',
                                            }}
                                          >
                                            <Hand size={13} />
                                          </span>
                                        )}
                                        <strong>{inventoryDisplayName(item)}</strong>
                                        {' • ilość: '}
                                        <InventoryQuantityInput
                                          value={
                                            isCoinInventoryItem(item)
                                              ? character.gold
                                              : item.quantity
                                          }
                                          decimals={isCoinInventoryItem(item)}
                                          disabled={item.isActiveLight}
                                          onCommit={value =>
                                            isCoinInventoryItem(item)
                                              ? changeCharacterCoins(
                                                  character,
                                                  value
                                                )
                                              : changeInventoryQuantity(
                                                  'character',
                                                  item.id,
                                                  value
                                                )
                                          }
                                        />
                                        {isCoinInventoryItem(item) &&
                                          coinCalculatorControl(character)}
                                        {' • '}
                                        {formatSlotRule(item)}
                                        {itemUsesControl('character', item)}
                                        {item.category === 'weapon' &&
                                          item.weaponDamage &&
                                          ` • ${item.weaponDamage}`}
                                        {item.category === 'armor' &&
                                          item.armorClass &&
                                          ` • AC ${item.armorClass}`}
                                        {item.category === 'weapon' &&
                                          ` • ${
                                            weaponHandsRequired(item) === 2
                                              ? '2 ręce'
                                              : '1 ręka'
                                          }`}
                                        {item.category === 'food' && (
                                          <span
                                            style={{
                                              marginLeft: 7,
                                              color: '#9fbd7f',
                                              fontSize: '0.9em',
                                              fontWeight: 700,
                                              fontStyle: 'italic',
                                            }}
                                          >
                                            • Jedzenie i przekazywanie obsługiwane z Dashboardu, Usuń jeśli chcesz wyrzucić.
                                          </span>
                                        )}
                                        {item.name.trim().toLowerCase() === 'torch' && (
                                          <span
                                            style={{
                                              marginLeft: 7,
                                              color: '#d6b56c',
                                              fontSize: '0.9em',
                                              fontWeight: 700,
                                              fontStyle: 'italic',
                                            }}
                                          >
                                            • Użyj z panelu Dashboard
                                          </span>
                                        )}
                                        {item.isQuickpull && ' • QUICKPULL'}
                                        {item.isEquipped && ' • WYPOSAŻONE'}
                                      </span>

                                      <div className="button-row">
                                        {(item.category === 'weapon' ||
                                          item.category === 'armor') && (
                                          <button
                                            className="secondary"
                                            onClick={() =>
                                              toggleEquippedItem(
                                                character,
                                                item
                                              )
                                            }
                                          >
                                            <Hand size={14} />
                                            {item.isEquipped
                                              ? 'Zdejmij'
                                              : 'Wyposaż'}
                                          </button>
                                        )}

                                        <button
                                          className="secondary"
                                          onClick={() =>
                                            toggleQuickpull(character, item)
                                          }
                                        >
                                          Quickpull
                                        </button>

                                        {item.category === 'container' && (
                                          <button
                                            type="button"
                                            className="secondary"
                                            onClick={() =>
                                              openFillContainer(item)
                                            }
                                            style={{
                                              border:
                                                '1px solid rgba(167, 126, 55, 0.72)',
                                              color: '#e3c27b',
                                              fontWeight: 800,
                                            }}
                                          >
                                            NAPEŁNIJ
                                          </button>
                                        )}

                                        {isUnidentifiedMagicalInventoryItem(
                                          item.catalogItemId
                                        ) && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              identifyMagicalInventoryItem(item)
                                            }
                                            title="Kliknij, aby zidentyfikować przedmiot i wpisać jego opis."
                                            style={{
                                              border:
                                                '1px solid rgba(199, 151, 55, 0.78)',
                                              background:
                                                'linear-gradient(180deg, rgba(108, 76, 22, 0.34), rgba(44, 30, 14, 0.88))',
                                              color: '#e6c56f',
                                              borderRadius: 7,
                                              padding: '6px 9px',
                                              fontSize: 12,
                                              fontWeight: 900,
                                              letterSpacing: '.45px',
                                              cursor: 'pointer',
                                            }}
                                          >
                                            NIEZIDENTYFIKOWANY
                                          </button>
                                        )}

                                        {(
                                          Boolean(
                                            descriptionForItem(
                                              item.catalogItemId
                                            )?.trim()
                                          ) ||
                                          (
                                            isMagicalInventoryItem(
                                              item.catalogItemId
                                            ) &&
                                            Boolean(
                                              magicDescriptionForItem(
                                                item.catalogItemId
                                              )?.trim()
                                            )
                                          )
                                        ) &&
                                          !isUnidentifiedMagicalInventoryItem(
                                            item.catalogItemId
                                          ) && (
                                            <button
                                              className="secondary"
                                              onClick={() =>
                                                openInventoryItemDescription(item)
                                              }
                                            >
                                              <BookOpen size={14} />
                                              Opis
                                            </button>
                                          )}

                                        <button
                                          className="secondary"
                                          onClick={() =>
                                            openTransferItem(
                                              'character',
                                              character.id,
                                              item
                                            )
                                          }
                                        >
                                          <ArrowRightLeft size={14} />
                                          Daj
                                        </button>

                                        <button
                                          className="danger"
                                          onClick={() =>
                                            removeItem(item)
                                          }
                                        >
                                          <Trash2 size={14} />
                                          Usuń
                                        </button>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginTop: 16,
                                paddingTop: 14,
                                borderTop: '1px solid rgba(180, 135, 60, 0.24)',
                              }}
                            >
                              <button
                                className="secondary"
                                onClick={() => openNewItem(character.id)}
                                style={{
                                  minWidth: 280,
                                  padding: '11px 18px',
                                  fontWeight: 800,
                                  letterSpacing: '.4px',
                                  border: '1px solid rgba(197, 148, 58, 0.62)',
                                  background:
                                    'linear-gradient(180deg, rgba(93, 67, 29, 0.22), rgba(24, 20, 14, 0.92))',
                                }}
                              >
                                <Package size={18} />
                                Podnieś przedmiot
                              </button>
                            </div>
                          </section>
                        </article>
                      )
                    })()}

                    {(selectedCharacterId ? [] : visibleCharacters).map(character => {
                        const maxSlots = Math.max(10, character.strength) + Math.max(0, character.bonusSlots)
                        const usedSlots = usedSlotsForCharacter(character.id)
                        const characterItems = itemsForCharacter(character.id)

                        return (
                          <article className="entity-card" key={character.id}>
                            <div className="entity-head">
                              <div>
                                <button
                                  type="button"
                                  onClick={() => openCharacterCard(character.id)}
                                  title={`Wyodrębnij kartę: ${character.name}`}
                                  style={{
                                    padding: 0,
                                    border: 0,
                                    background: 'transparent',
                                    color: '#ead09a',
                                    font: 'inherit',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    textDecoration: 'underline',
                                    textDecorationColor: 'rgba(207, 162, 77, 0.42)',
                                    textUnderlineOffset: 3,
                                  }}
                                >
                                  {character.name}
                                </button>
                                <span style={{ display: 'block', marginTop: 4 }}>
                                  {character.gold} gp • Quickpull {quickpullCount(character.id)}/{quickpullLimit(character)}
                                </span>
                                <span style={{ display: 'block', marginTop: 4 }}>
                                  HP <strong>{character.currentHp}/{effectiveMaxHp(character)}</strong>
                                  {character.temporaryHp > 0 && (
                                    <span className="muted"> (+{character.temporaryHp} tymcz.)</span>
                                  )}
                                  {' • '}AC <strong>{armorClassForCharacter(character)}</strong>
                                  {' • '}W rękach: <strong>{handsDisplayForCharacter(character.id)}</strong>
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
                                  Podnieś przedmiot
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

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '150px minmax(0, 1fr)',
                                gap: 14,
                                marginTop: 14,
                                alignItems: 'stretch',
                              }}
                            >
                              <div
                                style={{
                                  minHeight: 180,
                                  border: '1px solid rgba(180, 135, 60, 0.38)',
                                  borderRadius: 8,
                                  overflow: 'hidden',
                                  background: 'rgba(110, 83, 42, 0.08)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {character.portraitUrl ? (
                                  <img
                                    src={character.portraitUrl}
                                    alt={`Portret ${character.name}`}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      minHeight: 180,
                                      objectFit: 'cover',
                                      display: 'block',
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="muted"
                                    style={{
                                      textAlign: 'center',
                                      padding: 16,
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    <Users size={32} style={{ marginBottom: 8 }} />
                                    <div>PORTRET</div>
                                  </div>
                                )}
                              </div>

                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                  gap: 8,
                                }}
                              >
                                {[
                                  ['Ancestry', character.ancestry || '—'],
                                  ['Class', character.className || '—'],
                                  ['Level', character.level],
                                  ['XP', `${character.xp} / ${character.xpNext}`],
                                  ['Title', character.title || '—'],
                                  ['Alignment', character.alignment || '—'],
                                  ['Background', character.background || '—'],
                                  ['Deity', character.deity || '—'],
                                ].map(([label, value]) => (
                                  <div
                                    key={String(label)}
                                    style={{
                                      border: '1px solid rgba(180, 135, 60, 0.28)',
                                      borderRadius: 7,
                                      padding: '8px 10px',
                                      background: 'rgba(110, 83, 42, 0.07)',
                                    }}
                                  >
                                    <span className="muted">{label}</span>
                                    <strong style={{ display: 'block', marginTop: 3 }}>
                                      {value}
                                    </strong>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {(character.talentsSpells || character.backstory) && (
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                  gap: 10,
                                  marginTop: 12,
                                }}
                              >
                                <div
                                  style={{
                                    border: '1px solid rgba(180, 135, 60, 0.28)',
                                    borderRadius: 7,
                                    padding: '10px 12px',
                                    background: 'rgba(110, 83, 42, 0.07)',
                                    minHeight: 120,
                                  }}
                                >
                                  <strong>TALENTY / ZAKLĘCIA</strong>
                                  <div
                                    style={{
                                      whiteSpace: 'pre-wrap',
                                      marginTop: 8,
                                      lineHeight: 1.45,
                                    }}
                                  >
                                    {character.talentsSpells || '—'}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    border: '1px solid rgba(180, 135, 60, 0.28)',
                                    borderRadius: 7,
                                    padding: '10px 12px',
                                    background: 'rgba(110, 83, 42, 0.07)',
                                    minHeight: 120,
                                  }}
                                >
                                  <strong>HISTORIA POSTACI</strong>
                                  <div
                                    style={{
                                      whiteSpace: 'pre-wrap',
                                      marginTop: 8,
                                      lineHeight: 1.45,
                                    }}
                                  >
                                    {character.backstory || '—'}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(6, minmax(72px, 1fr))',
                                gap: 6,
                                marginTop: 12,
                              }}
                            >
                              {[
                                ['STR', character.strength],
                                ['DEX', character.dexterity],
                                ['CON', character.constitution],
                                ['INT', character.intelligence],
                                ['WIS', character.wisdom],
                                ['CHA', character.charisma],
                              ].map(([label, value]) => (
                                <div
                                  key={String(label)}
                                  style={{
                                    border: '1px solid rgba(180, 135, 60, 0.28)',
                                    borderRadius: 7,
                                    padding: '7px 8px',
                                    textAlign: 'center',
                                    background: 'rgba(110, 83, 42, 0.07)',
                                  }}
                                >
                                  <strong style={{ display: 'block' }}>{label}</strong>
                                  <span>{value} ({formatModifier(statModifier(Number(value)))})</span>
                                </div>
                              ))}
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                gap: 8,
                                marginTop: 12,
                              }}
                            >
                              <div
                                style={{
                                  border: '1px solid rgba(180, 135, 60, 0.28)',
                                  borderRadius: 7,
                                  padding: '8px 10px',
                                  background: 'rgba(110, 83, 42, 0.07)',
                                }}
                              >
                                <span className="muted">HP</span>
                                <strong style={{ display: 'block', marginTop: 3 }}>
                                  {character.currentHp}/{effectiveMaxHp(character)}
                                  {character.temporaryHp > 0 &&
                                    ` (+${character.temporaryHp} tymcz.)`}
                                </strong>
                              </div>

                              <div
                                style={{
                                  border: '1px solid rgba(180, 135, 60, 0.28)',
                                  borderRadius: 7,
                                  padding: '8px 10px',
                                  background: 'rgba(110, 83, 42, 0.07)',
                                }}
                              >
                                <span className="muted">AC</span>
                                <strong style={{ display: 'block', marginTop: 3 }}>
                                  {armorClassForCharacter(character)}
                                </strong>
                              </div>

                              <div
                                style={{
                                  border: '1px solid rgba(180, 135, 60, 0.28)',
                                  borderRadius: 7,
                                  padding: '8px 10px',
                                  background: 'rgba(110, 83, 42, 0.07)',
                                }}
                              >
                                <span className="muted">W rękach</span>
                                <strong style={{ display: 'block', marginTop: 3 }}>
                                  {handsDisplayForCharacter(character.id)}
                                </strong>
                              </div>
                            </div>

                            <div className="slot-line" style={{ marginTop: 12 }}>
                              <span>Ręce</span>
                              <b>
                                {(() => {
                                  const weapon = equippedWeaponForCharacter(character.id)
                                  const shield = equippedShieldForCharacter(character.id)
                                  const light = activeLightForCharacter(character.id)
                                  const used =
                                    (weapon ? weaponHandsRequired(weapon) : 0) +
                                    (shield ? 1 : 0) +
                                    (light ? 1 : 0)
                                  return `${used}/2 • ${handsDisplayForCharacter(character.id)}`
                                })()}
                              </b>
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
                                  {sortInventoryForDisplay(characterItems).map(item => (
                                    <div
                                      key={item.id}
                                      className="slot-line"
                                      style={{
                                        ...inventoryHighlightStyle(
                                          item.category,
                                          isMagicalInventoryItem(item.catalogItemId),
                                          isQuestInventoryItem(item.catalogItemId)
                                        ),
                                        ...(item.isEquipped
                                          ? {
                                              border: '1px solid rgba(80, 146, 76, 0.95)',
                                              boxShadow:
                                                'inset 0 0 0 1px rgba(127, 187, 108, 0.12), 0 0 8px rgba(70, 126, 63, 0.10)',
                                            }
                                          : {}),
                                        ...(item.isQuickpull
                                          ? {
                                              outline: '2px solid rgba(218, 183, 103, 0.95)',
                                              outlineOffset: '2px',
                                              boxShadow:
                                                '0 0 0 1px rgba(83, 63, 30, 0.85), inset 0 0 0 1px rgba(235, 207, 132, 0.14)',
                                            }
                                          : {}),
                                      }}
                                    >
                                      <span>
                                        {inventoryCategoryMarker(item)}
                                        {(item.isEquipped || item.isActiveLight) && (
                                          <span
                                            title={
                                              item.isActiveLight
                                                ? 'Trzymane źródło światła — zajmuje 1 rękę'
                                                : 'Założone / trzymane wyposażenie'
                                            }
                                            aria-label="Zajmuje rękę / wyposażone"
                                            style={{
                                              width: 21,
                                              height: 21,
                                              minWidth: 21,
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              borderRadius: 5,
                                              marginRight: 7,
                                              verticalAlign: 'middle',
                                              color: '#8fbe7d',
                                              border: '1px solid rgba(83, 145, 76, 0.62)',
                                              background: 'rgba(55, 100, 49, 0.17)',
                                            }}
                                          >
                                            <Hand size={13} />
                                          </span>
                                        )}
                                        <strong>{item.name}</strong>
                                        {' • ilość: '}
                                        {isCoinInventoryItem(item) ? (
                                          <>
                                            <InventoryQuantityInput
                                              value={character.gold}
                                              decimals
                                              onCommit={value =>
                                                changeCharacterCoins(character, value)
                                              }
                                            />
                                          </>
                                        ) : (
                                          <InventoryQuantityInput
                                            value={item.quantity}
                                            disabled={item.isActiveLight}
                                            onCommit={value =>
                                              changeInventoryQuantity(
                                                'character',
                                                item.id,
                                                value
                                              )
                                            }
                                          />
                                        )}
                                        {' • '}
                                        {isCoinInventoryItem(item) ? 'GP • ' : ''}
                                        {formatSlotRule(item)}
                                        {itemUsesControl('character', item)}
                                        
                                        {item.category === 'light' && ` • ${item.lightMinutes ?? 60} min`}
                                        {item.category === 'weapon' &&
                                          ` • broń${item.weaponDamage ? ` • obrażenia ${item.weaponDamage}` : ''}${item.weaponRange ? ` • zasięg ${item.weaponRange}` : ''}`}
                                        {item.category === 'armor' &&
                                          item.armorClass &&
                                          ` • AC ${item.armorClass}`}
                                        {isMagicalInventoryItem(item.catalogItemId) && ' • MAGICZNY'}
                                        {isQuestInventoryItem(item.catalogItemId) && ' • PRZEDMIOT ZADANIA'}
                                        {isMagicalInventoryItem(item.catalogItemId) &&
                                          magicDescriptionForItem(item.catalogItemId) &&
                                          ` • ${magicDescriptionForItem(item.catalogItemId)}`}
                                        {item.category === 'weapon' && item.weaponProperties &&
                                          ` • ${item.weaponProperties}`}
                                        {item.category === 'armor' && item.armorProperties &&
                                          ` • ${item.armorProperties}`}
                                        {item.isActiveLight && ' • AKTYWNE ŚWIATŁO'}
                                        {item.isQuickpull && ' • QUICKPULL'}
                                        {item.isEquipped && ' • WYPOSAŻONE'}
                                        {isMagicalInventoryItem(item.catalogItemId) && ' • MAGICZNY'}
                                        {isQuestInventoryItem(item.catalogItemId) && ' • PRZEDMIOT ZADANIA'}
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

                                        {(item.category === 'weapon' ||
                                          item.category === 'armor') && (
                                          <button
                                            className="secondary"
                                            onClick={() =>
                                              toggleEquippedItem(character, item)
                                            }
                                            title={
                                              item.isEquipped
                                                ? 'Zdejmij / odłóż'
                                                : item.category === 'weapon'
                                                  ? 'Ustaw jako aktywną broń'
                                                  : 'Załóż pancerz / tarczę'
                                            }
                                          >
                                            <Shield size={14} />
                                            {item.isEquipped ? 'Zdejmij' : 'Wyposaż'}
                                          </button>
                                        )}

                                        <button
                                          className="secondary"
                                          onClick={() => toggleQuickpull(character, item)}
                                          disabled={
                                            !item.isQuickpull &&
                                            quickpullCount(character.id) >= quickpullLimit(character)
                                          }
                                          title={`Quickpull ${quickpullCount(character.id)}/${quickpullLimit(character)}`}
                                        >
                                          {item.isQuickpull ? 'Usuń Quickpull' : 'Quickpull'}
                                        </button>

                                        {isMagicalInventoryItem(
                                          item.catalogItemId
                                        ) &&
                                          magicDescriptionForItem(
                                            item.catalogItemId
                                          ) && (
                                            <button
                                              className="secondary"
                                              onClick={() =>
                                                openMagicItemDescription(item)
                                              }
                                            >
                                              <BookOpen size={14} />
                                              Opis
                                            </button>
                                          )}

                                        <button
                                          className="secondary"
                                          onClick={() =>
                                            openTransferItem(
                                              'character',
                                              character.id,
                                              item
                                            )
                                          }
                                          disabled={item.isActiveLight}
                                        >
                                          <ArrowRightLeft size={14} />
                                          Daj
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
                                  {sortInventoryForDisplay(currentItems).map(item => {
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
                                            : inventoryHighlightStyle(item.category, isMagicalInventoryItem(item.catalogItemId), isQuestInventoryItem(item.catalogItemId))
                                        }
                                      >
                                        <span>
                                          {inventoryCategoryMarker(item)}
                                              <strong>{item.name}</strong>
                                          {wagon ? (
                                            <>
                                              {' • '}
                                              <b>WÓZ • +15 SLOTÓW UDŹWIGU</b>
                                              {' • specjalne wyposażenie zwierzęcia'}
                                            </>
                                          ) : (
                                            <>
                                              {' • ilość: '}
                                              <InventoryQuantityInput
                                                value={item.quantity}
                                                disabled={wagon}
                                                onCommit={value =>
                                                  changeInventoryQuantity('animal', item.id, value)
                                                }
                                              />
                                              {' • '}{formatSlotRule(item)}
                                        {itemUsesControl('animal', item)}
                                              
                                              {item.category === 'light' && ` • ${item.lightMinutes ?? 60} min`}
                                              {isMagicalInventoryItem(item.catalogItemId) && ' • MAGICZNY'}
                                        {isQuestInventoryItem(item.catalogItemId) && ' • PRZEDMIOT ZADANIA'}
                                              {isSaddleName(item.name) && ' • pierwsze siodło bez slotu'}
                                            </>
                                          )}
                                        </span>

                                        <span className="button-row">
                                          {isMagicalInventoryItem(
                                            item.catalogItemId
                                          ) &&
                                            magicDescriptionForItem(
                                              item.catalogItemId
                                            ) && (
                                              <button
                                                className="secondary"
                                                onClick={() =>
                                                  openMagicItemDescription(item)
                                                }
                                              >
                                                <BookOpen size={14} />
                                                Opis
                                              </button>
                                            )}

                                          <button
                                            className="secondary"
                                            onClick={() => openTransferItem('animal', animal.id, item)}
                                          >
                                            <ArrowRightLeft size={14} />
                                            Przenieś
                                          </button>
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

          {activeView === 'Postacie Fabularne' && (
            <>
              <section className="hero parchment-panel">
                <div>
                  <p className="eyebrow">POSTACIE FABULARNE</p>
                  <h1>{active?.name ?? 'Brak kampanii'}</h1>
                  <p>
                    Biblioteka spotkanych postaci świata. Bez statystyk i ekwipunku —
                    tylko informacje potrzebne do zapamiętania, kim są i gdzie pojawiły się w fabule.
                  </p>
                </div>

                <div className="button-row">
                  <button
                    className="secondary"
                    onClick={exportStoryCharactersCsv}
                    disabled={!activeId || storyCharacters.length === 0}
                    title="Eksportuj wszystkie Postacie Fabularne do pliku CSV"
                  >
                    <Download size={16} />
                    Eksport CSV
                  </button>

                  <button
                    className="primary"
                    onClick={openNewStoryCharacter}
                    disabled={!activeId}
                  >
                    <Plus size={16} />
                    Nowa Postać Fabularna
                  </button>
                </div>
              </section>

              <section className="panel">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'end',
                    gap: 14,
                    flexWrap: 'wrap',
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div className="panel-title" style={{ marginBottom: 4 }}>
                      <UserPlus size={18} />
                      Biblioteka Postaci Fabularnych
                    </div>
                    <span className="muted">
                      {storyCharacters.length} {storyCharacters.length === 1 ? 'postać' : 'postaci'}
                    </span>
                    <span className="muted" style={{ display: 'block', marginTop: 3 }}>
                      Eksport CSV zapisuje pełną bibliotekę niezależnie od aktualnego grupowania.
                    </span>
                  </div>

                  <label style={{ minWidth: 240 }}>
                    Grupuj według
                    <select
                      value={storyCharacterGroupMode}
                      onChange={e =>
                        setStoryCharacterGroupMode(
                          e.target.value as typeof storyCharacterGroupMode
                        )
                      }
                      style={themedSelectStyle}
                    >
                      <option value="alphabetical">Alfabetycznie</option>
                      <option value="location">Lokalizacja</option>
                      <option value="quest">Zadanie</option>
                      <option value="time">Czas spotkania</option>
                      <option value="faction">Frakcja</option>
                    </select>
                  </label>
                </div>

                {storyCharactersLoading ? (
                  <p className="muted">Ładowanie Postaci Fabularnych…</p>
                ) : storyCharacters.length === 0 ? (
                  <div className="empty-state">
                    <p>Nie zapisano jeszcze żadnej Postaci Fabularnej.</p>
                    <button className="primary" onClick={openNewStoryCharacter}>
                      <Plus size={16} />
                      Dodaj pierwszą postać
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 18 }}>
                    {storyCharacterGroups.map(([group, groupCharacters]) => (
                      <div key={`${storyCharacterGroupMode}:${group}`}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 9,
                            paddingBottom: 6,
                            borderBottom: '1px solid rgba(180, 135, 60, 0.30)',
                          }}
                        >
                          <strong style={{ color: '#e0bd75', fontSize: 15 }}>
                            {group}
                          </strong>
                          <span className="muted">• {storyCharacterGroupModeLabel()}</span>
                          <span className="muted" style={{ marginLeft: 'auto' }}>
                            {groupCharacters.length}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                            gap: 10,
                          }}
                        >
                          {groupCharacters.map(character => (
                            <article className="entity-card" key={character.id}>
                              <div className="entity-head">
                                <div>
                                  <strong style={{ fontSize: 18 }}>{character.name}</strong>
                                  <span className="muted" style={{ display: 'block', marginTop: 4 }}>
                                    {character.faction || 'Bez frakcji'}
                                  </span>
                                </div>

                                <div className="button-row">
                                  <button
                                    className="secondary"
                                    onClick={() => openEditStoryCharacter(character)}
                                  >
                                    <Pencil size={14} />
                                    Edytuj
                                  </button>
                                  <button
                                    className="danger"
                                    onClick={() => removeStoryCharacter(character)}
                                  >
                                    <Trash2 size={14} />
                                    Usuń
                                  </button>
                                </div>
                              </div>

                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                  gap: 8,
                                  marginTop: 12,
                                }}
                              >
                                <div style={{ border: '1px solid rgba(180,135,60,.24)', borderRadius: 7, padding: '8px 10px', background: 'rgba(110,83,42,.06)' }}>
                                  <span className="muted">Lokalizacja</span>
                                  <strong style={{ display: 'block', marginTop: 3 }}>
                                    {character.location || '—'}
                                  </strong>
                                </div>

                                <div style={{ border: '1px solid rgba(180,135,60,.24)', borderRadius: 7, padding: '8px 10px', background: 'rgba(110,83,42,.06)' }}>
                                  <span className="muted">Czas spotkania</span>
                                  <strong style={{ display: 'block', marginTop: 3 }}>
                                    {character.meetingTime || '—'}
                                  </strong>
                                </div>

                                <div style={{ border: '1px solid rgba(180,135,60,.24)', borderRadius: 7, padding: '8px 10px', background: 'rgba(110,83,42,.06)' }}>
                                  <span className="muted">Frakcja</span>
                                  <strong style={{ display: 'block', marginTop: 3 }}>
                                    {character.faction || '—'}
                                  </strong>
                                </div>

                                <div style={{ border: '1px solid rgba(180,135,60,.24)', borderRadius: 7, padding: '8px 10px', background: 'rgba(110,83,42,.06)' }}>
                                  <span className="muted">Zadanie</span>
                                  <strong style={{ display: 'block', marginTop: 3, whiteSpace: 'pre-wrap' }}>
                                    {character.quest || '—'}
                                  </strong>
                                </div>
                              </div>

                              <div
                                style={{
                                  marginTop: 8,
                                  border: '1px solid rgba(180,135,60,.24)',
                                  borderRadius: 7,
                                  padding: '9px 10px',
                                  background: 'rgba(110,83,42,.06)',
                                }}
                              >
                                <span className="muted">Okoliczności spotkania</span>
                                <div style={{ marginTop: 4, whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                                  {character.meetingCircumstances || '—'}
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                                  {sortInventoryForDisplay(currentItems).map(item => (
                                    <div
                                      key={item.id}
                                      className="slot-line"
                                      style={inventoryHighlightStyle(item.category, isMagicalInventoryItem(item.catalogItemId), isQuestInventoryItem(item.catalogItemId))}
                                    >
                                      <span>
                                        {inventoryCategoryMarker(item)}
                                        <strong>{item.name}</strong>
                                        {' • ilość: '}
                                        <InventoryQuantityInput
                                          value={item.quantity}
                                          disabled={item.isActiveLight}
                                          onCommit={value =>
                                            changeInventoryQuantity('npc', item.id, value)
                                          }
                                        />
                                        {' • '}{formatSlotRule(item)}
                                        {itemUsesControl('npc', item)}
                                        
                                        {item.category === 'light' && ` • ${item.lightMinutes ?? 60} min`}
                                        {item.category === 'weapon' &&
                                          ` • broń${item.weaponDamage ? ` • obrażenia ${item.weaponDamage}` : ''}`}
                                        {item.category === 'armor' &&
                                          ` • pancerz${item.armorClass ? ` • KP/AC ${item.armorClass}` : ''}`}
                                      </span>

                                      <span className="button-row">
                                        {isMagicalInventoryItem(
                                          item.catalogItemId
                                        ) &&
                                          magicDescriptionForItem(
                                            item.catalogItemId
                                          ) && (
                                            <button
                                              className="secondary"
                                              onClick={() =>
                                                openMagicItemDescription(item)
                                              }
                                            >
                                              <BookOpen size={14} />
                                              Opis
                                            </button>
                                          )}

                                        <button
                                          className="secondary"
                                          onClick={() => openTransferItem('npc', npc.id, item)}
                                          disabled={item.isActiveLight}
                                        >
                                          <ArrowRightLeft size={14} />
                                          Przenieś
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

          {activeView === 'Bastiony' && (
            <>
              <section className="hero parchment-panel">
                <div>
                  <p className="eyebrow">BASTIONY</p>
                  <h1>{active?.name ?? 'Brak kampanii'}</h1>
                  <p>
                    Bastion należy do postaci. Ma własne AC i HP. Przy 0 HP jego mury są przełamane.
                    Naprawa trwa 1 tydzień i kosztuje 1 gp za każde odzyskane HP. Zwykła broń nie uszkadza bastionów; mogą je uszkadzać machiny oblężnicze, niszczące żywioły (np. ogień) i ogromne stworzenia. Bastion daje bezpieczne schronienie przed pogodą, klimatem i losowymi spotkaniami. Disasters są pominięte.
                  </p>
                </div>

                <button className="primary" onClick={openNewBastion} disabled={!activeId || characters.length === 0}>
                  <Plus size={16} />
                  Nowy bastion
                </button>
              </section>

              <section className="dashboard-grid">
                <div className="panel wide">
                  <div className="panel-title">
                    <Castle size={18} />
                    Bastiony kampanii
                  </div>

                  {bastionsLoading ? (
                    <p className="muted">Ładowanie bastionów…</p>
                  ) : bastions.length === 0 ? (
                    <div className="empty-state">
                      <p>Brak bastionów. Każdy bastion musi należeć do jednej Postaci.</p>
                      {characters.length === 0 ? (
                        <p className="muted">Najpierw dodaj Postać.</p>
                      ) : (
                        <button className="primary" onClick={openNewBastion}>
                          <Plus size={16} />
                          Dodaj pierwszy bastion
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                      {bastions.map(bastion => {
                        const type = bastionTypeFor(bastion)
                        const installed = upgradesForBastion(bastion.id)
                        const owner = characters.find(character => character.id === bastion.ownerCharacterId)
                        const hpPercent = bastion.maxHp > 0 ? (bastion.currentHp / bastion.maxHp) * 100 : 0

                        return (
                          <article className="entity-card" key={bastion.id}>
                            <div className="entity-head">
                              <div>
                                <strong>{bastion.name}</strong>
                                <span style={{ display: 'block', marginTop: 4 }}>
                                  {type.name} • właściciel: {owner?.name ?? '—'}
                                </span>
                              </div>

                              <div className="button-row">
                                <button className="secondary" onClick={() => openBastionHp(bastion)}>
                                  <Pencil size={14} /> HP
                                </button>
                                <button
                                  className="secondary"
                                  onClick={() => openBastionRepair(bastion)}
                                  disabled={bastion.currentHp >= bastion.maxHp}
                                >
                                  Napraw
                                </button>
                                <button
                                  className="secondary"
                                  onClick={() => openBastionUpgrade(bastion)}
                                  disabled={installed.length >= bastion.maxUpgrades}
                                >
                                  <Plus size={14} /> Ulepszenie
                                </button>
                                <button className="danger" onClick={() => removeBastion(bastion)}>
                                  <Trash2 size={14} /> Usuń
                                </button>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(110px, 1fr))', gap: 10, marginTop: 14 }}>
                              <div><span className="muted">AC</span><strong style={{ display: 'block' }}>{bastion.ac}</strong></div>
                              <div><span className="muted">HP</span><strong style={{ display: 'block' }}>{bastion.currentHp}/{bastion.maxHp}</strong></div>
                              <div><span className="muted">Ulepszenia</span><strong style={{ display: 'block' }}>{installed.length}/{bastion.maxUpgrades}</strong></div>
                              <div><span className="muted">Budowa</span><strong style={{ display: 'block' }}>{bastion.buildTime}</strong></div>
                            </div>

                            <div className="progress small" style={{ marginTop: 10 }}>
                              <i style={{ width: `${Math.max(0, Math.min(100, hpPercent))}%` }} />
                            </div>

                            {bastion.currentHp === 0 && (
                              <div className="setup-banner" style={{ marginTop: 10 }}>
                                <Shield size={16} />
                                <div>
                                  <strong>MURY PRZEŁAMANE</strong>
                                  <span>Bastion ma 0 HP.</span>
                                </div>
                              </div>
                            )}

                            <p className="muted" style={{ marginTop: 10 }}>
                              Koszt typu: {type.cost.toLocaleString('pl-PL')} gp • {type.description}
                            </p>

                            <div style={{ marginTop: 14 }}>
                              <strong>Ulepszenia</strong>
                              {installed.length === 0 ? (
                                <p className="muted">Brak ulepszeń.</p>
                              ) : (
                                <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                                  {installed.map(installedUpgrade => {
                                    const rule = BASTION_UPGRADES.find(item => item.id === installedUpgrade.upgradeId)
                                    if (!rule) return null
                                    return (
                                      <div className="slot-line" key={installedUpgrade.id}>
                                        <span><strong>{rule.name}</strong> • {rule.cost} gp • {rule.description}</span>
                                        <button className="danger" onClick={() => removeInstalledBastionUpgrade(installedUpgrade)}>
                                          <Trash2 size={13} /> Usuń
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                            {hasVault(bastion.id) && (
                              <div
                                style={{
                                  marginTop: 16,
                                  paddingTop: 14,
                                  borderTop: '1px solid rgba(180, 135, 60, 0.28)',
                                }}
                              >
                                <div className="entity-head">
                                  <div>
                                    <strong>VAULT — EKWIPUNEK BASTIONU</strong>
                                    <span style={{ display: 'block', marginTop: 4 }}>
                                      {Number(usedBastionSlots(bastion.id).toFixed(2))}/100 slotów
                                    </span>
                                  </div>
                                </div>

                                {bastionItemsLoading ? (
                                  <p className="muted">Ładowanie Vault…</p>
                                ) : itemsForBastion(bastion.id).length === 0 ? (
                                  <p className="muted">Vault jest pusty.</p>
                                ) : (
                                  <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                                    {sortInventoryForDisplay(itemsForBastion(bastion.id)).map(item => (
                                      <div
                                        key={item.id}
                                        className="slot-line"
                                        style={inventoryHighlightStyle(
                                          item.category,
                                          isMagicalInventoryItem(item.catalogItemId),
                                          isQuestInventoryItem(item.catalogItemId)
                                        )}
                                      >
                                        <span>
                                          {inventoryCategoryMarker(item)}
                                          <strong>{item.name}</strong>
                                          {' • ilość: '}
                                          <InventoryQuantityInput
                                            value={item.quantity}
                                            onCommit={value =>
                                              changeInventoryQuantity('bastion', item.id, value)
                                            }
                                          />
                                          {' • '}{formatSlotRule(item)}
                                        {itemUsesControl('bastion', item)}
                                          
                                          {item.category === 'light' && ` • ${item.lightMinutes ?? 60} min`}
                                          {isMagicalInventoryItem(item.catalogItemId) && ' • MAGICZNY'}
                                        {isQuestInventoryItem(item.catalogItemId) && ' • PRZEDMIOT ZADANIA'}
                                        </span>
                                        <span className="button-row">
                                          {isMagicalInventoryItem(
                                            item.catalogItemId
                                          ) &&
                                            magicDescriptionForItem(
                                              item.catalogItemId
                                            ) && (
                                              <button
                                                className="secondary"
                                                onClick={() =>
                                                  openMagicItemDescription(item)
                                                }
                                              >
                                                <BookOpen size={14} />
                                                Opis
                                              </button>
                                            )}

                                          <button
                                            className="secondary"
                                            onClick={() =>
                                              openTransferItem(
                                                'bastion',
                                                bastion.id,
                                                item
                                              )
                                            }
                                          >
                                            <ArrowRightLeft size={14} /> Przenieś
                                          </button>
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
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

              <section className="panel" style={{ marginTop: 16 }}>
                <div className="panel-title"><Building2 size={18} /> Typy bastionów</div>
                <div className="entity-grid">
                  {BASTION_TYPES.map(type => (
                    <article className="entity-card" key={type.id}>
                      <div className="entity-head"><strong>{type.name}</strong><span>{type.cost.toLocaleString('pl-PL')} gp</span></div>
                      <p className="muted">AC {type.ac} • HP {type.hp} • {type.upgrades} ulepszeń • {type.buildTime}</p>
                      <p className="muted">{type.description}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel" style={{ marginTop: 16 }}>
                <div className="panel-title"><KeyRound size={18} /> Ulepszenia bastionów</div>
                <p className="muted">Każde ulepszenie buduje się 1 tydzień. W jednym bastionie można mieć tylko po jednym egzemplarzu każdego ulepszenia.</p>
                <div className="entity-grid">
                  {BASTION_UPGRADES.map(upgrade => (
                    <article className="entity-card" key={upgrade.id}>
                      <div className="entity-head"><strong>{upgrade.name}</strong><span>{upgrade.cost} gp</span></div>
                      <p className="muted">{upgrade.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeView === 'Mapa' && (
            <>
              <section className="hero parchment-panel">
                <div>
                  <p className="eyebrow">MAPA KAMPANII • MAP-6.4</p>
                  <h1>The Gloaming</h1>
                  <p>
                    Fog of War jest zapisany w Supabase i synchronizowany
                    między użytkownikami kampanii. Każdy może stawiać markery
                    również na zakrytych heksach. Markery MG są wyraźnie oznaczone.
                  </p>
                </div>
              </section>

              <section className="panel" style={{ marginTop: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginBottom: 12,
                  }}
                >
                  <button
                    className={mapGmMode && mapGmUnlocked ? 'primary' : 'secondary'}
                    onClick={() => {
                      if (!mapGmUnlocked) {
                        setMapGmCode('')
                        setMapGmCodeError(false)
                        setShowMapGmCode(true)
                        return
                      }
                      setMapGmMode(value => !value)
                    }}
                  >
                    {mapGmUnlocked
                      ? mapGmMode
                        ? 'Tryb MG: WŁ.'
                        : 'Podgląd gracza'
                      : 'Tryb MG'}
                  </button>
                  <button
                    className={mapDiagnosticMode ? 'primary' : 'secondary'}
                    onClick={() => setMapDiagnosticMode(value => !value)}
                  >
                    {mapDiagnosticMode
                      ? 'Diagnostyka: WŁ.'
                      : 'Diagnostyka: WYŁ.'}
                  </button>
                  {mapLoading && (
                    <span className="muted">Synchronizacja mapy…</span>
                  )}
                  <button
                    className={mapTool === 'markers' ? 'primary' : 'secondary'}
                    onClick={() => setMapTool('markers')}
                  >
                    📍 Markery
                  </button>
                  {mapGmUnlocked && mapGmMode && (
                    <button
                      className={mapTool === 'fog' ? 'primary' : 'secondary'}
                      onClick={() => setMapTool('fog')}
                    >
                      🌫 Mgła wojny
                    </button>
                  )}
                  <span className="muted">
                    Odkryte: {mapRevealedHexes.size}/178 • Markery: {mapMarkers.length}
                    {mapMarkersLoading ? ' • synchronizacja…' : ''} • kod HKKWW
                  </span>
                </div>

                {canManageMap && mapGmMode && selectedHexId && (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: '10px 12px',
                      border: '1px solid rgba(190, 145, 65, 0.55)',
                      borderRadius: 8,
                      background: 'rgba(94, 66, 25, 0.18)',
                    }}
                  >
                    Heks: <strong>{selectedHexId}</strong> •{' '}
                    {mapRevealedHexes.has(selectedHexId)
                      ? 'ODKRYTY'
                      : 'UKRYTY'}
                  </div>
                )}

                <div
                  style={{
                    position: 'relative',
                    padding: '14px',
                    borderRadius: 14,
                    border: '1px solid rgba(180, 135, 60, 0.42)',
                    background: '#17120d',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,.45)',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(820px, 1fr) 255px',
                      gap: 12,
                      alignItems: 'start',
                      overflowX: 'auto',
                      paddingTop: 0,
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        minWidth: 720,
                        aspectRatio: '2048 / 1523',
                        border: '1px solid rgba(77,45,18,.7)',
                        borderRadius: 3,
                        boxShadow:
                          '0 10px 22px rgba(0,0,0,.58)',
                        backgroundImage: `url(${import.meta.env.BASE_URL}map-parchment.jpg)`,
                        backgroundSize: 'cover',
                        overflow: 'hidden',
                      }}
                    >
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${import.meta.env.BASE_URL}map-parchment.jpg)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <img
                      src={`${import.meta.env.BASE_URL}gloaming-hex-map.png`}
                      alt="Mapa The Gloaming"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'fill',
                        display: 'block',
                        mixBlendMode: 'multiply',
                        filter: 'sepia(.08) contrast(1.04)',
                      }}
                    />
                    <svg
                      viewBox="0 0 2048 1523"
                      preserveAspectRatio="none"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      {Array.from({ length: 17 }, (_, columnIndex) => {
                        const column = columnIndex + 1
                        const evenColumn = column % 2 === 0
                        const rowCount = evenColumn ? 11 : 10
                        const mapColumnCenters = [
                          132, 243, 354, 465, 576, 687, 799, 910, 1022,
                          1133, 1244, 1355, 1467, 1578, 1690, 1801, 1913,
                        ]
                        const oddColumnRowCenters = [
                          182, 311, 440, 569, 698,
                          827, 956, 1085, 1214, 1343,
                        ]
                        const evenColumnRowCenters = [
                          117, 246, 375, 504, 633, 762,
                          891, 1020, 1149, 1278, 1407,
                        ]
                        const centerX = mapColumnCenters[columnIndex]

                        return Array.from({ length: rowCount }, (_, rowIndex) => {
                          const row = rowIndex + 1
                          const centerY = (
                            evenColumn
                              ? evenColumnRowCenters
                              : oddColumnRowCenters
                          )[rowIndex]
                          const id = `H${String(column).padStart(2, '0')}${String(row).padStart(2, '0')}`
                          const halfWidth = 77
                          const halfHeight = 64.5
                          const quarterWidth = 38.5
                          const points = [
                            `${centerX - quarterWidth},${centerY - halfHeight}`,
                            `${centerX + quarterWidth},${centerY - halfHeight}`,
                            `${centerX + halfWidth},${centerY}`,
                            `${centerX + quarterWidth},${centerY + halfHeight}`,
                            `${centerX - quarterWidth},${centerY + halfHeight}`,
                            `${centerX - halfWidth},${centerY}`,
                          ].join(' ')
                          const revealed = mapRevealedHexes.has(id)

                          return (
                            <g key={id}>
                              <polygon
                                points={points}
                                fill={
                                  revealed
                                    ? selectedHexId === id && mapGmMode
                                      ? 'rgba(207, 161, 72, 0.18)'
                                      : 'transparent'
                                    : canManageMap && mapGmMode
                                      ? 'rgba(17, 16, 13, 0.88)'
                                      : '#11100d'
                                }
                                stroke={
                                  mapDiagnosticMode
                                    ? 'rgba(184, 126, 31, 0.95)'
                                    : canManageMap && mapGmMode && !revealed
                                      ? 'rgba(128, 101, 55, 0.48)'
                                      : 'transparent'
                                }
                                strokeWidth={mapDiagnosticMode ? 3 : 1.5}
                                vectorEffect="non-scaling-stroke"
                                onClick={() => {
                                  setSelectedHexId(id)
                                  if (mapTool === 'markers') {
                                    openNewMapMarker(id)
                                    return
                                  }
                                  if (!canManageMap || !mapGmMode) return
                                  void toggleCampaignHex(id)
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              {mapMarkers
                                .filter(marker => marker.hexId === id)
                                .slice(0, 3)
                                .map((marker, markerIndex) => (
                                  <g
                                    key={marker.id}
                                    transform={`translate(${centerX + (markerIndex - 1) * 34} ${centerY})`}
                                    onClick={event => {
                                      event.stopPropagation()
                                      openEditMapMarker(marker)
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <circle
                                      r="23"
                                      fill={marker.isGm ? '#5f4014' : '#171512'}
                                      stroke={marker.isGm ? '#f0bd55' : '#c59b55'}
                                      strokeWidth={marker.isGm ? 4 : 2}
                                      vectorEffect="non-scaling-stroke"
                                    />
                                    <text
                                      x="0"
                                      y="7"
                                      textAnchor="middle"
                                      fontSize="25"
                                      pointerEvents="none"
                                    >
                                      {mapMarkerDefinitions[marker.markerType].icon}
                                    </text>
                                    {marker.isGm && (
                                      <text
                                        x="0"
                                        y="-29"
                                        textAnchor="middle"
                                        fontSize="13"
                                        fontWeight="900"
                                        fill="#f0bd55"
                                        stroke="#11100d"
                                        strokeWidth="3"
                                        paintOrder="stroke"
                                        pointerEvents="none"
                                      >
                                        MG
                                      </text>
                                    )}
                                  </g>
                                ))}
                              {mapDiagnosticMode && (
                                <text
                                  x={centerX}
                                  y={centerY + 5}
                                  textAnchor="middle"
                                  fontSize="19"
                                  fontWeight="700"
                                  fill={revealed ? '#6b3f00' : '#e8c477'}
                                  stroke={
                                    revealed
                                      ? 'rgba(255, 244, 211, 0.96)'
                                      : 'rgba(17, 16, 13, 0.96)'
                                  }
                                  strokeWidth="4"
                                  paintOrder="stroke"
                                  pointerEvents="none"
                                >
                                  {id}
                                </text>
                              )}
                            </g>
                          )
                        })
                      })}
                    </svg>
                    </div>

                    <aside
                      style={{
                        position: 'relative',
                        minWidth: 230,
                        minHeight: '100%',
                        marginTop: 0,
                        paddingTop: 132,
                        backgroundImage: `linear-gradient(rgba(20,10,5,.12), rgba(20,10,5,.12)), url(${import.meta.env.BASE_URL}map-table-right.jpg)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center top',
                        backgroundRepeat: 'no-repeat',
                        border: '1px solid rgba(190,145,65,.55)',
                        borderRadius: 10,
                        padding: '132px 14px 14px',
                        boxShadow: '0 12px 26px rgba(0,0,0,.58)',
                      }}
                    >
                      <div className="panel-title" style={{ marginBottom: 12 }}>
                        📍 Lista markerów
                        <span style={{ marginLeft: 'auto' }}>{mapMarkers.length}</span>
                      </div>

                      <div style={{ display: 'grid', gap: 12 }}>
                        {(Object.entries(mapMarkerDefinitions) as [MapMarkerType, { icon: string; label: string }][]).map(
                          ([type, definition]) => {
                            const markers = mapMarkers
                              .filter(marker => marker.markerType === type)
                              .sort((a, b) => a.name.localeCompare(b.name, 'pl'))

                            if (markers.length === 0) return null

                            return (
                              <div key={type}>
                                <div
                                  className="muted"
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '.06em',
                                    marginBottom: 5,
                                  }}
                                >
                                  {definition.icon} {definition.label}
                                </div>
                                <div style={{ display: 'grid', gap: 4 }}>
                                  {markers.map(marker => (
                                    <button
                                      key={marker.id}
                                      className="secondary"
                                      onClick={() => {
                                        setSelectedHexId(marker.hexId)
                                        setSelectedLegendMarker(marker)
                                      }}
                                      style={{
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        textAlign: 'left',
                                        padding: '7px 9px',
                                      }}
                                      title={marker.name}
                                    >
                                      <span>{definition.icon}</span>
                                      <span
                                        style={{
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {marker.name}
                                      </span>
                                      {marker.isGm && (
                                        <strong
                                          style={{
                                            marginLeft: 'auto',
                                            color: '#f0bd55',
                                            fontSize: 11,
                                          }}
                                        >
                                          MG
                                        </strong>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )
                          }
                        )}

                        {mapMarkers.length === 0 && (
                          <p className="muted" style={{ margin: 0 }}>
                            Brak markerów na mapie.
                          </p>
                        )}
                      </div>
                    </aside>
                  </div>
                </div>

                <p className="muted" style={{ marginTop: 10 }}>
                  MAP-6.4 • markery są wspólne i można je stawiać również na
                  zakrytych heksach. Marker nie odkrywa mapy. MG może przy zapisie
                  markera pozostawić heks bez zmian, odkryć go albo zakryć.
                </p>
              </section>
            </>
          )}

          {selectedLegendMarker && (
            <Modal onClose={() => setSelectedLegendMarker(null)}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: 4 }}>
                    {mapMarkerDefinitions[selectedLegendMarker.markerType].icon}{' '}
                    {mapMarkerDefinitions[selectedLegendMarker.markerType].label}
                    {' • '}
                    {selectedLegendMarker.hexId}
                  </p>
                  <h2 style={{ margin: 0 }}>{selectedLegendMarker.name}</h2>
                  {selectedLegendMarker.isGm && (
                    <p style={{ margin: '6px 0 0', color: '#f0bd55', fontWeight: 800 }}>
                      Marker MG
                    </p>
                  )}
                </div>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid rgba(190,145,65,.4)',
                    background: 'rgba(94,66,25,.15)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedLegendMarker.note?.trim() || 'Brak dodatkowego opisu.'}
                </div>
              </div>
            </Modal>
          )}

          {showMapMarker && (
            <Modal
              onClose={() => {
                setShowMapMarker(false)
                setEditingMapMarker(null)
              }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: 4 }}>
                    MARKER • {mapMarkerHexId}
                  </p>
                  <h2 style={{ margin: 0 }}>
                    {editingMapMarker ? 'Edytuj marker' : 'Dodaj marker'}
                  </h2>
                  {editingMapMarker?.isGm && (
                    <p style={{ margin: '6px 0 0', color: '#f0bd55', fontWeight: 800 }}>
                      Marker MG
                    </p>
                  )}
                </div>

                <label>
                  Typ
                  <select
                    value={mapMarkerType}
                    onChange={e => setMapMarkerType(e.target.value as MapMarkerType)}
                    style={themedSelectStyle}
                  >
                    {(Object.entries(mapMarkerDefinitions) as [MapMarkerType, { icon: string; label: string }][]).map(
                      ([value, definition]) => (
                        <option key={value} value={value}>
                          {definition.icon} {definition.label}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Nazwa
                  <input
                    value={mapMarkerName}
                    onChange={e => setMapMarkerName(e.target.value)}
                    placeholder="Np. Stara wieża"
                    maxLength={80}
                  />
                </label>

                <label>
                  Notatka
                  <textarea
                    value={mapMarkerNote}
                    onChange={e => setMapMarkerNote(e.target.value)}
                    placeholder="Krótka informacja o miejscu..."
                    rows={4}
                    maxLength={500}
                  />
                </label>

                {mapGmUnlocked && mapGmMode && (
                  <label>
                    Stan heksa po zapisaniu
                    <select
                      value={mapMarkerHexAction}
                      onChange={e =>
                        setMapMarkerHexAction(
                          e.target.value as 'keep' | 'reveal' | 'hide'
                        )
                      }
                      style={themedSelectStyle}
                    >
                      <option value="keep">Pozostaw bez zmian</option>
                      <option value="reveal">Odkryj heks</option>
                      <option value="hide">Zakryj heks</option>
                    </select>
                  </label>
                )}

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className="primary"
                    onClick={() => void saveMapMarker()}
                    disabled={!mapMarkerName.trim()}
                  >
                    {editingMapMarker ? 'Zapisz marker' : 'Dodaj marker'}
                  </button>

                  {editingMapMarker && (
                    <button
                      className="secondary"
                      onClick={() => void removeMapMarker(editingMapMarker)}
                    >
                      Usuń marker
                    </button>
                  )}
                </div>
              </div>
            </Modal>
          )}

          {showMapGmCode && (
            <Modal
              onClose={() => {
                setShowMapGmCode(false)
                setMapGmCode('')
                setMapGmCodeError(false)
              }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: 4 }}>NARZĘDZIA PROWADZĄCEGO</p>
                  <h2 style={{ margin: 0 }}>Odblokuj tryb MG</h2>
                </div>
                <label>
                  Kod MG
                  <input
                    type="password"
                    value={mapGmCode}
                    autoFocus
                    onChange={e => {
                      setMapGmCode(e.target.value)
                      setMapGmCodeError(false)
                    }}
                    onKeyDown={e => {
                      if (e.key !== 'Enter') return
                      if (mapGmCode === 'MG2026Shadow') {
                        setMapGmUnlocked(true)
                        setMapGmMode(true)
                        setShowMapGmCode(false)
                        setMapGmCode('')
                        setMapGmCodeError(false)
                      } else {
                        setMapGmCodeError(true)
                      }
                    }}
                    placeholder="Wpisz kod MG"
                  />
                </label>

                {mapGmCodeError && (
                  <div style={{ color: '#d88f72', fontWeight: 700 }}>
                    Nieprawidłowy kod MG.
                  </div>
                )}

                <button
                  className="primary"
                  onClick={() => {
                    if (mapGmCode === 'MG2026Shadow') {
                      setMapGmUnlocked(true)
                      setMapGmMode(true)
                      setShowMapGmCode(false)
                      setMapGmCode('')
                      setMapGmCodeError(false)
                    } else {
                      setMapGmCodeError(true)
                    }
                  }}
                >
                  Odblokuj tryb MG
                </button>
              </div>
            </Modal>
          )}

          {activeView === 'Skrzynia ze skarbami' && (
            <>
              <section
                className="hero parchment-panel"
                style={{
                  background:
                    `linear-gradient(90deg, rgba(17,11,5,.93), rgba(17,11,5,.48)), url(${import.meta.env.BASE_URL}treasure-chest.jpg) center / cover no-repeat`,
                  minHeight: 220,
                }}
              >
                <div>
                  <p className="eyebrow">SKRZYNIA ZE SKARBAMI</p>
                  <h1>Niepodzielone łupy drużyny</h1>
                  <p>Przedmioty w skrzyni nie należą jeszcze do żadnej postaci i nie są aktywnym wyposażeniem ekspedycji.</p>
                </div>
                <div className="button-row">
                  <button className="primary" onClick={() => setShowTreasureAdd(true)}>
                    <Plus size={16} /> Dodaj skarb
                  </button>
                </div>
              </section>

              <section className="panel">
                <div className="panel-title">
                  <Coins size={18} />
                  Zawartość skrzyni
                  <span style={{ marginLeft: 'auto' }}>{treasureItems.length} pozycji</span>
                </div>
                {treasureLoading ? (
                  <p className="muted">Ładowanie skrzyni…</p>
                ) : treasureItems.length === 0 ? (
                  <div className="empty-state"><p>Skrzynia jest pusta.</p></div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {treasureItems.map(item => (
                      <article className="entity-card" key={item.id}>
                        <div className="entity-head">
                          <div>
                            <strong>{item.name}</strong>
                            <div className="muted">{item.category} • {item.quantity} szt.</div>
                          </div>
                          <div className="button-row">
                            <button
                              className="secondary"
                              onClick={() => {
                                setTreasureTransferItem(item)
                                setTreasureRecipientId(activeCharacters[0]?.id ?? '')
                              }}
                              disabled={activeCharacters.length === 0}
                            >
                              <ArrowRightLeft size={14} /> Daj
                            </button>
                            <button
                              className="danger"
                              onClick={async () => {
                                if (!window.confirm(`Usunąć „${item.name}” ze skrzyni?`)) return
                                await deleteTreasureItem(item.id)
                                await refreshTreasure()
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {activeView === 'Cmentarz' && (
            <>
              <style>{`
                .cemetery-scene {
                  position: relative;
                  overflow: hidden;
                  border-radius: 14px;
                  border: 1px solid rgba(178, 129, 52, .38);
                  background:
                    linear-gradient(rgba(7, 8, 8, .48), rgba(7, 8, 8, .82)),
                    url(${import.meta.env.BASE_URL}cemetery-background.jpg) center / cover no-repeat;
                  box-shadow: inset 0 0 80px rgba(0,0,0,.72);
                  min-height: 720px;
                }
                .cemetery-scene::before {
                  content: '';
                  position: absolute;
                  inset: 0;
                  pointer-events: none;
                  background: radial-gradient(circle at 50% 28%, transparent 0 30%, rgba(0,0,0,.58) 100%);
                }
                .cemetery-grid {
                  position: relative;
                  z-index: 1;
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(255px, 1fr));
                  gap: 18px;
                  padding: 24px;
                }
                .grave-card {
                  position: relative;
                  min-height: 430px;
                  overflow: hidden;
                  border: 1px solid rgba(170, 135, 77, .46);
                  border-radius: 15px 15px 9px 9px;
                  padding: 118px 34px 34px;
                  cursor: pointer;
                  color: #d7c5a4;
                  text-align: center;
                  background:
                    linear-gradient(180deg, rgba(14,14,13,.08), rgba(10,10,9,.34) 34%, rgba(8,8,7,.94) 100%),
                    url(${import.meta.env.BASE_URL}cemetery-tombstone.jpg) center / 100% 100% no-repeat;
                  filter: grayscale(.42) saturate(.72);
                  box-shadow: inset 0 0 40px rgba(0,0,0,.62), 0 12px 28px rgba(0,0,0,.36);
                  transition: transform .18s ease, filter .18s ease, border-color .18s ease;
                }
                .grave-card:hover {
                  transform: translateY(-3px);
                  filter: grayscale(.24) saturate(.88);
                  border-color: rgba(211, 158, 68, .8);
                }
                .grave-card h3 {
                  margin: 0;
                  font-family: Georgia, serif;
                  font-size: 24px;
                  letter-spacing: .04em;
                  color: #d8c4a0;
                  text-shadow: 0 2px 5px #000;
                }
                .grave-date {
                  margin-top: 34px;
                  padding-top: 13px;
                  border-top: 1px solid rgba(191, 153, 89, .35);
                  font-family: Georgia, serif;
                  font-size: 16px;
                }
                .grave-cause {
                  margin: 13px auto 0;
                  max-width: 230px;
                  min-height: 48px;
                  font-family: Georgia, serif;
                  font-style: italic;
                  line-height: 1.5;
                  color: #c7b28e;
                }
                .cemetery-modal-card {
                  filter: grayscale(.86);
                }
                @media (max-width: 760px) {
                  .cemetery-grid { grid-template-columns: 1fr; padding: 12px; }
                  .grave-card { min-height: 390px; }
                }
              `}</style>

              <section className="hero parchment-panel">
                <div>
                  <p className="eyebrow">☠ CMENTARZ</p>
                  <h1>Poległe postacie</h1>
                  <p>Ci, którzy odeszli, ale wciąż są częścią historii kampanii.</p>
                </div>
              </section>

              <section className="cemetery-scene">
                {cemeteryLoading || charactersLoading || itemsLoading ? (
                  <p className="muted" style={{ position: 'relative', zIndex: 1, padding: 24 }}>
                    Ładowanie Cmentarza…
                  </p>
                ) : cemeteryCharacters.length === 0 ? (
                  <div className="empty-state" style={{ position: 'relative', zIndex: 1, margin: 24 }}>
                    <Skull size={42} style={{ opacity: .55 }} />
                    <p>Cmentarz jest pusty.</p>
                  </div>
                ) : (
                  <div className="cemetery-grid">
                    {cemeteryCharacters.map(character => {
                      const memorial = memorialForCharacter(character.id)
                      return (
                        <button
                          type="button"
                          className="grave-card"
                          key={`grave-${character.id}`}
                          onClick={() => setCemeterySelectedCharacterId(character.id)}
                        >
                          <div style={{ position: 'relative', zIndex: 1 }}>
                            <Skull size={23} style={{ marginBottom: 8, opacity: .7 }} />
                            <h3>{character.name}</h3>
                            <div className="muted" style={{ marginTop: 5 }}>
                              {character.className || 'Postać'} • Poziom {character.level}
                            </div>

                            <div className="grave-date">
                              † Zmarł:
                              {memorial?.deathDay ? ` Dzień ${memorial.deathDay}` : ' —'}
                              {memorial?.deathSession ? ` • Sesja ${memorial.deathSession}` : ''}
                            </div>

                            <div className="grave-cause">
                              {memorial?.deathCause || 'Przyczyna śmierci nie została zapisana.'}
                            </div>

                            <div
                              className="muted"
                              style={{ marginTop: 24, fontSize: 12, letterSpacing: '.08em' }}
                            >
                              KLIKNIJ, ABY OTWORZYĆ KARTĘ
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {activeView === 'Kronika' && (
            <>
              <style>{`
                .chronicle-scroll {
                  scrollbar-width: auto;
                  scrollbar-color: #9b672d rgba(78, 46, 19, .18);
                }
                .chronicle-scroll::-webkit-scrollbar {
                  width: 12px;
                }
                .chronicle-scroll::-webkit-scrollbar-track {
                  background: rgba(78, 46, 19, .16);
                  border: 1px solid rgba(74, 43, 17, .24);
                  border-radius: 8px;
                }
                .chronicle-scroll::-webkit-scrollbar-thumb {
                  background: linear-gradient(#b9873d, #765020);
                  border: 2px solid rgba(65, 38, 16, .55);
                  border-radius: 8px;
                }
                .chronicle-scroll::-webkit-scrollbar-thumb:hover {
                  background: linear-gradient(#c99a4d, #875d27);
                }
              `}</style>
              <section className="hero parchment-panel">
                <div>
                  <p className="eyebrow">KRONIKA KAMPANII • ETAP 2</p>
                  <h1>Kronika {active?.name ?? ''}</h1>
                  <p>
                    Dziennik wydarzeń świata gry uporządkowany według dni,
                    pór roku i numerów sesji.
                  </p>
                </div>
                <button
                  className="primary"
                  onClick={openNewChronicleEntry}
                  disabled={!activeId || chronicleLoading}
                >
                  <Plus size={16} />
                  Nowy wpis
                </button>
              </section>

              <section className="panel">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(210px, 270px) minmax(0, 1fr)',
                    gap: 22,
                    alignItems: 'stretch',
                  }}
                >
                  <aside
                    style={{
                      position: 'relative',
                      minHeight: 650,
                      padding: '18px 10px 18px 6px',
                      borderRight: '1px solid rgba(184,139,64,.32)',
                    }}
                  >
                    <div className="panel-title" style={{ marginBottom: 18 }}>
                      <ScrollText size={17} />
                      Oś czasu
                    </div>

                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        left: 38,
                        top: 64,
                        bottom: 24,
                        width: 2,
                        background:
                          'linear-gradient(#6e4a1c, #d0a252 45%, #6e4a1c)',
                        opacity: .72,
                      }}
                    />

                    <div style={{ display: 'grid', gap: 8, position: 'relative' }}>
                      {chronicleEntries.map((entry, index) => {
                        const previous = chronicleEntries[index - 1]
                        const showSeason = !previous || previous.season !== entry.season
                        const showSession = !previous || previous.sessionNumber !== entry.sessionNumber
                        const selected = selectedChronicle?.id === entry.id

                        return (
                          <div key={entry.id}>
                            {showSeason && (
                              <div
                                style={{
                                  margin: '10px 0 8px 55px',
                                  color: '#d2ad68',
                                  fontFamily: 'Georgia, serif',
                                  fontWeight: 800,
                                  letterSpacing: '.08em',
                                  textTransform: 'uppercase',
                                  fontSize: 12,
                                }}
                              >
                                {entry.season}
                              </div>
                            )}
                            {showSession && (
                              <div
                                style={{
                                  position: 'relative',
                                  margin: '8px 0 6px 55px',
                                  color: '#b98a42',
                                  fontSize: 11,
                                  fontWeight: 800,
                                  letterSpacing: '.08em',
                                  textTransform: 'uppercase',
                                }}
                              >
                                <span
                                  style={{
                                    position: 'absolute',
                                    left: -34,
                                    top: '50%',
                                    width: 10,
                                    height: 10,
                                    transform: 'translate(-50%, -50%) rotate(45deg)',
                                    background: '#b98a42',
                                    border: '2px solid #17130e',
                                  }}
                                />
                                Sesja {entry.sessionNumber}
                              </div>
                            )}
                            <button
                              className={selected ? 'primary' : 'secondary'}
                              onClick={() => setSelectedChronicleId(entry.id)}
                              style={{
                                position: 'relative',
                                width: '100%',
                                minHeight: 54,
                                padding: '8px 8px 8px 58px',
                                textAlign: 'left',
                                justifyContent: 'flex-start',
                              }}
                            >
                              <span
                                style={{
                                  position: 'absolute',
                                  left: 25,
                                  top: '50%',
                                  width: selected ? 16 : 12,
                                  height: selected ? 16 : 12,
                                  borderRadius: '50%',
                                  transform: 'translate(-50%, -50%)',
                                  background: selected ? '#d6a64e' : '#17130e',
                                  border: '2px solid #c49443',
                                  boxShadow: '0 0 0 3px rgba(20,15,9,.9)',
                                }}
                              />
                              <span style={{ display: 'grid', gap: 2 }}>
                                <strong>Dzień {entry.worldDay}</strong>
                                <span
                                  style={{
                                    fontSize: 11,
                                    opacity: .72,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {entry.title}
                                </span>
                              </span>
                            </button>
                          </div>
                        )
                      })}

                      {!chronicleLoading && chronicleEntries.length === 0 && (
                        <div className="muted" style={{ padding: '20px 12px 20px 56px' }}>
                          Kronika jest jeszcze pusta.
                        </div>
                      )}
                    </div>
                  </aside>

                  <article
                    style={{
                      minHeight: 650,
                      padding: '42px clamp(28px, 5vw, 72px)',
                      color: '#352414',
                      position: 'relative',
                      backgroundImage: `url(${import.meta.env.BASE_URL}chronicle-book-clean.jpg)`,
                      backgroundSize: '100% 100%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      border: '1px solid rgba(101,63,25,.65)',
                      borderRadius: 5,
                      boxShadow: '0 15px 32px rgba(0,0,0,.48)',
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      overflow: 'hidden',
                    }}
                  >
                    {selectedChronicle ? (
                      <div
                        style={{
                          width: '43%',
                          marginLeft: '53%',
                          marginTop: 8,
                          marginBottom: 8,
                          padding: '8px 8px 20px',
                          minHeight: 520,
                          maxHeight: 650,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        <div
                          style={{
                            textAlign: 'center',
                            borderBottom: '1px solid rgba(83,52,25,.35)',
                            paddingBottom: 16,
                            marginBottom: 22,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              letterSpacing: '.14em',
                              textTransform: 'uppercase',
                              opacity: .72,
                            }}
                          >
                            {selectedChronicle.season} • Dzień {selectedChronicle.worldDay} • Sesja {selectedChronicle.sessionNumber}
                          </div>
                          <h2
                            style={{
                              margin: '10px 0 0',
                              fontSize: 'clamp(26px, 3vw, 38px)',
                              color: '#3b2612',
                            }}
                          >
                            {selectedChronicle.title}
                          </h2>
                          <button
                            className="secondary"
                            onClick={() => openEditChronicleEntry(selectedChronicle)}
                            style={{
                              position: 'absolute',
                              right: 8,
                              top: 8,
                              padding: '6px 8px',
                              fontSize: 11,
                            }}
                            title="Edytuj wpis"
                          >
                            <Pencil size={13} />
                          </button>
                        </div>

                        <div
                          style={{
                            maxHeight: 500,
                            overflowY: 'auto',
                            paddingRight: 12,
                            whiteSpace: 'pre-wrap',
                            fontSize: 18,
                            lineHeight: 1.85,
                            letterSpacing: '.01em',
                          }}
                          className="chronicle-scroll"
                        >
                          {renderChronicleText(selectedChronicle.content)}
                        </div>

                      </div>
                    ) : (
                      <div
                        style={{
                          minHeight: 520,
                          width: '43%',
                          marginLeft: '53%',
                          display: 'grid',
                          placeItems: 'center',
                          textAlign: 'center',
                          color: '#352414',
                        }}
                      >
                        <div>
                          <ScrollText size={46} style={{ opacity: .55 }} />
                          <h2>Kronika czeka na pierwszy zapis</h2>
                          <p>Dodaj pierwszy dzień przygody.</p>
                        </div>
                      </div>
                    )}
                  </article>
                </div>
              </section>
            </>
          )}

          {showBackupMenu && (
            <Modal
              onClose={() => {
                if (backupRestoreBusy) return
                setShowBackupMenu(false)
                setBackupRestoreFile(null)
                setBackupRestoreData(null)
                setBackupRestoreConfirm('')
              }}
            >
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <p className="eyebrow">KAMPANIA</p>
                  <h2 style={{ margin: 0 }}>Kopia zapasowa</h2>
                  <p className="muted">
                    Zapisz aktualny stan kampanii albo przywróć wcześniej utworzoną kopię.
                  </p>
                </div>

                <section
                  style={{
                    padding: 14,
                    border: '1px solid rgba(190,145,65,.38)',
                    borderRadius: 8,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <strong>Utwórz kopię</strong>
                  <span className="muted">
                    Pobiera aktualny stan kampanii jako plik JSON.
                  </span>
                  <button
                    className="secondary full"
                    onClick={downloadCampaignBackup}
                    disabled={backupRestoreBusy}
                  >
                    <Download size={16} />
                    Utwórz kopię zapasową
                  </button>
                </section>

                <section
                  style={{
                    padding: 14,
                    border: '1px solid rgba(190,145,65,.38)',
                    borderRadius: 8,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <strong>Wczytaj kopię</strong>
                  <label
                    className="secondary full"
                    style={{
                      cursor: backupRestoreBusy ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Upload size={16} />
                    Wybierz plik kopii zapasowej
                    <input
                      type="file"
                      accept=".json,application/json"
                      disabled={backupRestoreBusy}
                      onChange={e => void selectBackupRestoreFile(e.target.files?.[0] ?? null)}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {backupRestoreData && (
                    <div
                      style={{
                        padding: 12,
                        border: '1px solid rgba(190,145,65,.28)',
                        borderRadius: 7,
                        background: 'rgba(0,0,0,.18)',
                        display: 'grid',
                        gap: 5,
                      }}
                    >
                      <strong>{backupRestoreData.campaign?.name ?? 'Kampania'}</strong>
                      <span className="muted">
                        Utworzono:{' '}
                        {backupRestoreData.createdAt
                          ? new Date(backupRestoreData.createdAt).toLocaleString('pl-PL')
                          : 'brak daty'}
                      </span>
                      <span className="muted">
                        Postacie: {backupRestoreData.data?.characters?.length ?? 0} •
                        Ekwipunek: {backupRestoreData.data?.character_items?.length ?? 0} •
                        Kronika: {backupRestoreData.data?.campaign_chronicle?.length ?? 0} •
                        Skarby: {backupRestoreData.data?.campaign_treasure_items?.length ?? 0}
                      </span>

                      {backupRestoreData.campaign?.id !== activeId ? (
                        <div className="setup-banner">
                          <Shield size={16} />
                          <div>
                            <strong>Inna kampania</strong>
                            <span>
                              Kopia ma inny identyfikator kampanii i nie może zostać
                              wczytana do obecnej kampanii.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="setup-banner">
                            <Shield size={16} />
                            <div>
                              <strong>Uwaga</strong>
                              <span>
                                Przywrócenie zastąpi bieżący stan danych kampanii stanem
                                zapisanym w tym pliku.
                              </span>
                            </div>
                          </div>
                          <label>
                            Aby potwierdzić, wpisz <strong>PRZYWRÓĆ</strong>
                            <input
                              value={backupRestoreConfirm}
                              onChange={e => setBackupRestoreConfirm(e.target.value)}
                              disabled={backupRestoreBusy}
                              autoComplete="off"
                            />
                          </label>
                          <button
                            className="danger full"
                            disabled={
                              backupRestoreBusy ||
                              backupRestoreConfirm.trim().toUpperCase() !== 'PRZYWRÓĆ'
                            }
                            onClick={() => void restoreCampaignBackup()}
                          >
                            <Upload size={16} />
                            {backupRestoreBusy
                              ? 'Przywracanie…'
                              : 'Przywróć kopię zapasową'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </section>
              </div>
            </Modal>
          )}

          {showTreasureAdd && (
            <Modal onClose={() => setShowTreasureAdd(false)}>
              <div style={{ display: 'grid', gap: 12 }}>
                <p className="eyebrow">SKRZYNIA ZE SKARBAMI</p>
                <h2 style={{ margin: 0 }}>Dodaj niepodzielony łup</h2>
                <label>Nazwa<input value={treasureName} onChange={e => setTreasureName(e.target.value)} /></label>
                <label>Ilość<input type="number" min={1} value={treasureQuantity} onChange={e => setTreasureQuantity(Math.max(1, Number(e.target.value)))} /></label>
                <label>
                  Kategoria
                  <select value={treasureCategory} onChange={e => setTreasureCategory(e.target.value as ItemCategory)}>
                    <option value="normal">Normalny</option>
                    <option value="weapon">Broń</option>
                    <option value="armor">Zbroja</option>
                    <option value="food">Jedzenie</option>
                    <option value="light">Źródło światła</option>
                    <option value="container">Pojemnik</option>
                  </select>
                </label>
                <button className="primary full" onClick={() => void handleAddTreasure()}>Dodaj do skrzyni</button>
              </div>
            </Modal>
          )}

          {treasureTransferItem && (
            <Modal onClose={() => setTreasureTransferItem(null)}>
              <div style={{ display: 'grid', gap: 12 }}>
                <p className="eyebrow">PODZIAŁ ŁUPÓW</p>
                <h2 style={{ margin: 0 }}>{treasureTransferItem.name}</h2>
                <label>
                  Przekaż żywej postaci
                  <select value={treasureRecipientId} onChange={e => setTreasureRecipientId(e.target.value)}>
                    {activeCharacters.map(character => (
                      <option key={character.id} value={character.id}>{character.name}</option>
                    ))}
                  </select>
                </label>
                <button className="primary full" onClick={() => void handleGiveTreasure()}>
                  <ArrowRightLeft size={16} /> Przekaż cały stos
                </button>
              </div>
            </Modal>
          )}

          {cemeterySelectedCharacter && (
            <Modal onClose={() => setCemeterySelectedCharacterId(null)}>
              {(() => {
                const character = cemeterySelectedCharacter
                const memorial = memorialForCharacter(character.id)
                const deadItems = itemsForCharacter(character.id)
                return (
                  <div className="cemetery-modal-card" style={{ display: 'grid', gap: 16 }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: character.portraitUrl ? '170px 1fr' : '1fr',
                        gap: 18,
                        alignItems: 'start',
                      }}
                    >
                      {character.portraitUrl && (
                        <img
                          src={character.portraitUrl}
                          alt={`Portret ${character.name}`}
                          style={{
                            width: '100%',
                            aspectRatio: '4 / 5',
                            objectFit: 'cover',
                            borderRadius: 8,
                            filter: 'grayscale(1) contrast(.9)',
                            border: '1px solid rgba(170,150,120,.35)',
                          }}
                        />
                      )}
                      <div>
                        <p className="eyebrow" style={{ margin: 0 }}>☠ NIE ŻYJE</p>
                        <h2 style={{ margin: '5px 0' }}>{character.name}</h2>
                        <p className="muted">
                          {character.className || 'Postać'} • Poziom {character.level}
                        </p>
                        <div
                          style={{
                            marginTop: 14,
                            padding: 12,
                            border: '1px solid rgba(150,150,145,.3)',
                            borderRadius: 7,
                          }}
                        >
                          <div>
                            <strong>Zmarł:</strong>
                            {memorial?.deathDay ? ` Dzień ${memorial.deathDay}` : ' —'}
                            {memorial?.deathSession ? ` • Sesja ${memorial.deathSession}` : ''}
                          </div>
                          <div style={{ marginTop: 7 }}>
                            <strong>Przyczyna:</strong>{' '}
                            {memorial?.deathCause || 'Nie zapisana'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        paddingTop: 14,
                        borderTop: '1px solid rgba(150,150,145,.28)',
                      }}
                    >
                      <div className="panel-title">
                        Ekwipunek
                        <span style={{ marginLeft: 'auto' }}>{deadItems.length}</span>
                      </div>

                      {deadItems.length === 0 ? (
                        <p className="muted">Brak ekwipunku.</p>
                      ) : (
                        <div style={{ display: 'grid', gap: 7 }}>
                          {deadItems.map(item => (
                            <div
                              key={item.id}
                              style={{
                                display: 'flex',
                                gap: 10,
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '9px 10px',
                                border: '1px solid rgba(150,150,145,.24)',
                                borderRadius: 7,
                              }}
                            >
                              <span>
                                <strong>{item.name}</strong>
                                {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                              </span>
                              <button
                                className="secondary"
                                onClick={() =>
                                  openTransferItem('character', character.id, item)
                                }
                                disabled={activeCharacters.length === 0}
                              >
                                <ArrowRightLeft size={14} />
                                Daj
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="button-row">
                      <button
                        className="secondary"
                        onClick={() => {
                          setCemeterySelectedCharacterId(null)
                          void restoreDeadCharacter(character)
                        }}
                      >
                        Przywróć do drużyny
                      </button>
                    </div>
                  </div>
                )
              })()}
            </Modal>
          )}

          {showDeathModal && deathCharacter && (
            <Modal
              onClose={() => {
                setShowDeathModal(false)
                setDeathCharacter(null)
              }}
            >
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: 4 }}>CMENTARZ</p>
                  <h2 style={{ margin: 0 }}>† {deathCharacter.name}</h2>
                  <p className="muted">
                    Postać przestanie być członkiem aktywnej drużyny. Jej karta
                    i cały ekwipunek zostaną zachowane na Cmentarzu.
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                  }}
                >
                  <label>
                    Dzień śmierci
                    <input
                      type="number"
                      min={1}
                      value={deathDay}
                      onChange={e => setDeathDay(e.target.value)}
                      placeholder="opcjonalnie"
                    />
                  </label>
                  <label>
                    Numer sesji
                    <input
                      type="number"
                      min={1}
                      value={deathSession}
                      onChange={e => setDeathSession(e.target.value)}
                      placeholder="opcjonalnie"
                    />
                  </label>
                </div>

                <label>
                  Przyczyna śmierci
                  <textarea
                    rows={4}
                    maxLength={500}
                    value={deathCause}
                    onChange={e => setDeathCause(e.target.value)}
                    placeholder="Np. poległ podczas walki z trollem..."
                  />
                </label>

                <button className="danger full" onClick={() => void confirmCharacterDeath()}>
                  <Skull size={16} />
                  Przenieś na Cmentarz
                </button>
              </div>
            </Modal>
          )}

          {chronicleLinkedStoryCharacter && (
            <Modal onClose={() => setChronicleLinkedStoryCharacter(null)}>
              <div style={{ display: 'grid', gap: 12 }}>
                <p className="eyebrow" style={{ margin: 0 }}>POSTAĆ FABULARNA</p>
                <h2 style={{ margin: 0 }}>{chronicleLinkedStoryCharacter.name}</h2>
                {chronicleLinkedStoryCharacter.location && (
                  <p style={{ margin: 0 }}>
                    <strong>Miejsce:</strong> {chronicleLinkedStoryCharacter.location}
                  </p>
                )}
                <button
                  className="primary"
                  onClick={() => {
                    setChronicleLinkedStoryCharacter(null)
                    setActiveView('Postacie Fabularne')
                  }}
                >
                  Otwórz Postacie Fabularne
                </button>
              </div>
            </Modal>
          )}

          {chronicleLinkedMarker && (
            <Modal onClose={() => setChronicleLinkedMarker(null)}>
              <div style={{ display: 'grid', gap: 12 }}>
                <p className="eyebrow" style={{ margin: 0 }}>
                  📍 MIEJSCE • {chronicleLinkedMarker.hexId}
                </p>
                <h2 style={{ margin: 0 }}>{chronicleLinkedMarker.name}</h2>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    padding: 12,
                    border: '1px solid rgba(190,145,65,.4)',
                    borderRadius: 8,
                  }}
                >
                  {chronicleLinkedMarker.note?.trim() || 'Brak dodatkowego opisu.'}
                </div>
                <button
                  className="primary"
                  onClick={() => {
                    setSelectedHexId(chronicleLinkedMarker.hexId)
                    setChronicleLinkedMarker(null)
                    setActiveView('Mapa')
                  }}
                >
                  Pokaż na mapie
                </button>
              </div>
            </Modal>
          )}

          {showChronicleEditor && (
            <Modal
              onClose={() => {
                setShowChronicleEditor(false)
                setEditingChronicle(null)
              }}
            >
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: 4 }}>KRONIKA</p>
                  <h2 style={{ margin: 0 }}>
                    {editingChronicle ? 'Edytuj wpis' : 'Nowy wpis'}
                  </h2>
                </div>

                <label>
                  Tytuł
                  <input
                    value={chronicleTitle}
                    onChange={e => setChronicleTitle(e.target.value)}
                    placeholder="Np. W cieniu Wardenwood"
                    maxLength={120}
                  />
                </label>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 10,
                  }}
                >
                  <label>
                    Dzień
                    <input
                      type="number"
                      min={1}
                      value={chronicleDay}
                      onChange={e => setChronicleDay(Number(e.target.value) || 1)}
                    />
                  </label>
                  <label>
                    Sesja
                    <input
                      type="number"
                      min={1}
                      value={chronicleSession}
                      onChange={e => setChronicleSession(Number(e.target.value) || 1)}
                    />
                  </label>
                  <label>
                    Pora roku
                    <select
                      value={chronicleSeason}
                      onChange={e => setChronicleSeason(e.target.value as ChronicleSeason)}
                      style={themedSelectStyle}
                    >
                      {chronicleSeasons.map(season => (
                        <option key={season} value={season}>{season}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  Treść kroniki
                  <textarea
                    value={chronicleContent}
                    onChange={e =>
                      updateChronicleMention(
                        e.target.value,
                        e.target.selectionStart ?? e.target.value.length
                      )
                    }
                    onClick={e => {
                      const target = e.currentTarget
                      updateChronicleMention(
                        target.value,
                        target.selectionStart ?? target.value.length
                      )
                    }}
                    placeholder="Opisz wydarzenia sesji... Wpisz @, aby dodać odnośnik."
                    rows={14}
                    maxLength={12000}
                  />
                </label>

                {chronicleMentionQuery !== null && (
                  <div
                    style={{
                      maxHeight: 260,
                      overflowY: 'auto',
                      border: '1px solid rgba(190,145,65,.55)',
                      borderRadius: 8,
                      background: '#15110d',
                      padding: 6,
                      display: 'grid',
                      gap: 4,
                    }}
                  >
                    {chronicleMentionSuggestions.map(item => (
                      <button
                        key={`${item.kind}-${item.name}`}
                        type="button"
                        className="secondary"
                        onClick={() => insertChronicleMention(item.name)}
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          padding: '8px 10px',
                        }}
                      >
                        <span style={{ width: 24 }}>
                          {item.kind === 'character' ? '👤' : '📍'}
                        </span>
                        <span style={{ display: 'grid', gap: 1 }}>
                          <strong>{item.name}</strong>
                          <span className="muted" style={{ fontSize: 11 }}>
                            {item.subtitle}
                          </span>
                        </span>
                      </button>
                    ))}
                    {chronicleMentionSuggestions.length === 0 && (
                      <div className="muted" style={{ padding: 8 }}>
                        Brak pasujących Postaci Fabularnych lub markerów miejsc.
                      </div>
                    )}
                  </div>
                )}

                <div className="muted">
                  Wpisz @ i wybierz Postać Fabularną albo marker miejsca.
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className="primary"
                    onClick={() => void saveChronicleEntry()}
                    disabled={!chronicleTitle.trim() || !chronicleContent.trim()}
                  >
                    {editingChronicle ? 'Zapisz zmiany' : 'Dodaj do Kroniki'}
                  </button>
                  {editingChronicle && (
                    <button
                      className="secondary"
                      onClick={() => void removeChronicleEntry(editingChronicle)}
                    >
                      <Trash2 size={15} />
                      Usuń wpis
                    </button>
                  )}
                </div>
              </div>
            </Modal>
          )}

          {activeView === 'Historia' && (
            <>
              <section className="hero parchment-panel">
                <div>
                  <p className="eyebrow">HISTORIA OPERACJI</p>
                  <h1>{active?.name ?? 'Brak aktywnej kampanii'}</h1>
                  <p>
                    Wspólny, synchronizowany zapis najważniejszych operacji
                    wykonywanych przez użytkowników kampanii. Nowe, odwracalne
                    zmiany można bezpiecznie cofnąć bezpośrednio z Historii.
                  </p>
                </div>

                <button
                  className="secondary"
                  onClick={refreshHistory}
                  disabled={historyLoading || !activeId}
                >
                  <ArrowRightLeft size={16} />
                  Odśwież
                </button>
              </section>

              <section className="panel">
                <div className="panel-title">
                  <ArrowRightLeft size={18} />
                  Historia
                  <span style={{ marginLeft: 'auto' }}>
                    {filteredHistory.length} wpisów
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'end',
                    marginBottom: 16,
                  }}
                >
                  <label style={{ minWidth: 230 }}>
                    Filtr
                    <select
                      value={historyFilter}
                      onChange={e =>
                        setHistoryFilter(
                          e.target.value as 'all' | HistoryEventType
                        )
                      }
                      style={themedSelectStyle}
                    >
                      <option value="all">Wszystkie operacje</option>
                      <option value="inventory">Ekwipunek</option>
                      <option value="trade">Handel</option>
                      <option value="light">Światło</option>
                      <option value="food">Prowiant</option>
                      <option value="character">Postacie</option>
                      <option value="npc">NPC</option>
                      <option value="animal">Zwierzęta</option>
                      <option value="bastion">Bastiony</option>
                      <option value="library">Biblioteka</option>
                      <option value="other">Inne</option>
                    </select>
                  </label>
                </div>

                {historyLoading ? (
                  <p className="muted">Ładowanie historii…</p>
                ) : filteredHistory.length === 0 ? (
                  <div className="empty-state">
                    <p>Brak zapisanych operacji dla tego filtra.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {filteredHistory.map(entry => (
                      <article
                        key={entry.id}
                        className="entity-card"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '165px 110px minmax(0, 1fr) auto',
                          gap: 14,
                          alignItems: 'center',
                        }}
                      >
                        <span className="muted">
                          {formatHistoryTime(entry.createdAt)}
                        </span>

                        <span
                          style={{
                            justifySelf: 'start',
                            padding: '4px 7px',
                            borderRadius: 5,
                            border: '1px solid rgba(180, 135, 60, 0.32)',
                            background: 'rgba(110, 83, 42, 0.08)',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {historyTypeLabel(entry.eventType)}
                        </span>

                        <div>
                          <strong
                            style={{
                              textDecoration: entry.undoneAt
                                ? 'line-through'
                                : 'none',
                              opacity: entry.undoneAt ? 0.58 : 1,
                            }}
                          >
                            {entry.message}
                          </strong>
                          {entry.undoneAt && (
                            <span
                              className="muted"
                              style={{ display: 'block', marginTop: 3 }}
                            >
                              Cofnięto: {formatHistoryTime(entry.undoneAt)}
                            </span>
                          )}
                        </div>

                        <div style={{ justifySelf: 'end' }}>
                          {entry.undoPayload && !entry.undoneAt ? (
                            <button
                              className="secondary"
                              onClick={() => void undoHistoryEntry(entry)}
                              disabled={undoingHistoryId === entry.id}
                              title="Cofnij tę zmianę"
                            >
                              <ArrowRightLeft size={14} />
                              {undoingHistoryId === entry.id
                                ? 'Cofanie…'
                                : 'Cofnij'}
                            </button>
                          ) : entry.undoneAt ? (
                            <span className="muted">Cofnięta</span>
                          ) : (
                            <span
                              className="muted"
                              title="Ta starsza operacja nie zawiera danych potrzebnych do bezpiecznego cofnięcia."
                            >
                              —
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {activeView === 'Podsumowanie' && (
            <>
              <section className="hero parchment-panel">
                <div>
                  <p className="eyebrow">PODSUMOWANIE EKWIPUNKU</p>
                  <h1>{active?.name ?? 'Brak aktywnej kampanii'}</h1>
                  <p>
                    Wszystkie przedmioty Postaci, NPC, Zwierząt i Bastionów.
                    Lista jest alfabetyczna i pokazuje dokładnie kto posiada dany przedmiot oraz w jakiej ilości.
                  </p>
                </div>
              </section>

              <section className="panel">
                <div className="panel-title">
                  <Package size={18} />
                  Cały majątek rzeczowy kampanii
                  <span style={{ marginLeft: 'auto' }}>{inventorySummary.length} rodzajów przedmiotów</span>
                </div>

                {inventorySummary.length === 0 ? (
                  <div className="empty-state">
                    <p>W kampanii nie ma jeszcze żadnych przedmiotów.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {inventorySummary.map(group => (
                      <article
                        key={group.key}
                        className="entity-card"
                        style={inventoryHighlightStyle(
                          group.category,
                          isMagicalInventoryItem(group.catalogItemId),
                          isQuestInventoryItem(group.catalogItemId)
                        )}
                      >
                        <div className="entity-head">
                          <strong>
                            {inventoryCategoryMarker({ name: group.name, catalogItemId: group.catalogItemId, category: group.category })}
                            {group.name}
                            {isMagicalInventoryItem(group.catalogItemId) ? ' • MAGICZNY' : ''}
                            {isQuestInventoryItem(group.catalogItemId) ? ' • PRZEDMIOT ZADANIA' : ''}
                          </strong>
                          <span>Łącznie: {group.total}</span>
                        </div>

                        <div style={{ display: 'grid', gap: 6, marginTop: 10 }}>
                          {group.owners.map(owner => (
                            <div
                              key={owner.key}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 16,
                                paddingTop: 6,
                                borderTop: '1px solid rgba(180, 135, 60, 0.18)',
                              }}
                            >
                              <span>
                                <b>{owner.owner}</b>
                                <span className="muted"> • {owner.ownerType}</span>
                              </span>
                              <strong>× {owner.quantity}</strong>
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
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
                          style={inventoryHighlightStyle(entry.category, entry.isMagical, entry.isQuestItem)}
                        >
                          <div className="entity-head">
                            {inventoryCategoryMarker({ name: entry.name, catalogItemId: entry.id, category: entry.category })}
                            <strong>{entry.name}</strong>
                            <span>
                              {catalogCategoryLabel(entry.category)}
                              {entry.isMagical ? ' • MAGICZNY' : ''}
                              {entry.isQuestItem ? ' • PRZEDMIOT ZADANIA' : ''}
                            </span>
                          </div>
                          <p className="muted" style={{ marginTop: 10 }}>{catalogItemDetails(entry)}</p>
                          <div className="button-row">
                            <button
                              className="secondary"
                              onClick={() => openEditCatalogItem(entry)}
                            >
                              <Pencil size={15} />
                              Edytuj
                            </button>
                            <button
                              className="danger"
                              onClick={() => removeCatalogEntry(entry)}
                            >
                              <Trash2 size={15} />
                              Usuń z biblioteki
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


        </main>

      </div>

      {showTransferItem && (
        <Modal onClose={() => setShowTransferItem(false)}>
          <p className="eyebrow">PRZENOSZENIE</p>
          <h2>Przenieś: {transferItemName}</h2>

          <label>
            Ilość
            <input
              type="number"
              min="1"
              max={transferMaxQuantity}
              value={transferQuantity}
              onChange={e =>
                setTransferQuantity(
                  Math.min(
                    transferMaxQuantity,
                    Math.max(1, Number(e.target.value) || 1)
                  )
                )
              }
            />
          </label>

          <label>
            Do ekwipunku
            <select
              value={transferToKey}
              onChange={e => setTransferToKey(e.target.value)}
            >
              <option value="">— wybierz —</option>
              {inventoryDestinations
                .filter(destination => {
                  if (
                    destination.key ===
                    `${transferFromType}:${transferFromOwnerId}`
                  ) {
                    return false
                  }

                  if (
                    isWagonName(transferItemName) &&
                    destination.type !== 'animal'
                  ) {
                    return false
                  }

                  return true
                })
                .map(destination => (
                  <option key={destination.key} value={destination.key}>
                    {destination.label}
                  </option>
                ))}
            </select>
          </label>

          <p className="muted">
            Przeniesienie nie zmienia majątku. Sprawdzana jest pojemność
            ekwipunku docelowego. Wóz można przenieść wyłącznie do innego
            zwierzęcia.
          </p>

          <button
            className="primary full"
            onClick={executeTransferItem}
            disabled={transferringItem || !transferToKey}
          >
            {transferringItem ? 'Przenoszenie…' : 'Przenieś'}
          </button>
        </Modal>
      )}

      {descriptionItem && (
        <Modal onClose={() => setDescriptionItem(null)}>
          <p className="eyebrow">OPIS PRZEDMIOTU</p>
          <h2>{descriptionItem.name}</h2>
          <div
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.65,
              padding: '14px 16px',
              borderRadius: 8,
              border: '1px solid rgba(180, 135, 60, 0.38)',
              background: 'rgba(24, 20, 14, 0.72)',
            }}
          >
            {descriptionItem.description}
          </div>
        </Modal>
      )}

      {magicDescriptionItem && (
        <Modal onClose={() => setMagicDescriptionItem(null)}>
          <div
            style={{
              textAlign: 'center',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                margin: '0 auto 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                border: '1px solid rgba(98, 142, 194, 0.65)',
                background:
                  'linear-gradient(180deg, rgba(45, 76, 119, 0.32), rgba(20, 27, 38, 0.78))',
                boxShadow:
                  'inset 0 0 18px rgba(106, 162, 221, 0.10)',
              }}
            >
              <BookOpen size={30} />
            </div>
            <p className="eyebrow">MAGICZNY PRZEDMIOT</p>
            <h2>{magicDescriptionItem.name}</h2>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: 9,
              border: '1px solid rgba(98, 142, 194, 0.46)',
              background:
                'linear-gradient(180deg, rgba(44, 66, 96, 0.18), rgba(18, 18, 17, 0.86))',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
            }}
          >
            {magicDescriptionItem.description}
          </div>
        </Modal>
      )}

      {showCharacterShop && shopCharacterId && (
        <Modal
          onClose={() => {
            setShowCharacterShop(false)
            setShopCharacterId('')
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 82,
                height: 82,
                margin: '0 auto 12px',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(197, 148, 58, 0.68)',
                background:
                  'radial-gradient(circle at 50% 35%, rgba(151, 103, 38, .35), rgba(21, 18, 13, .96) 72%)',
                boxShadow:
                  'inset 0 0 22px rgba(218, 174, 83, .10), 0 5px 18px rgba(0,0,0,.28)',
              }}
            >
              <Building2 size={45} strokeWidth={1.5} />
            </div>

            <p className="eyebrow">SKLEP</p>
            <h2 style={{ marginBottom: 4 }}>
              {characters.find(character => character.id === shopCharacterId)?.name ?? 'Postać'}
            </h2>
            <p className="muted" style={{ marginTop: 0 }}>
              Zakupy i sprzedaż dotyczą wyłącznie tej Postaci.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 12,
                marginTop: 18,
              }}
            >
              <button
                className="primary"
                onClick={openCharacterShopBuy}
                style={{
                  minHeight: 88,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 17,
                }}
              >
                <Coins size={28} />
                KUP
              </button>

              <button
                className="secondary"
                onClick={openCharacterShopSell}
                disabled={
                  itemsForCharacter(shopCharacterId).filter(
                    item => !isCoinInventoryItem(item)
                  ).length === 0
                }
                style={{
                  minHeight: 88,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 17,
                }}
              >
                <Package size={28} />
                SPRZEDAJ
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showShopSellPicker && shopCharacterId && (
        <Modal
          onClose={() => {
            setShowShopSellPicker(false)
          }}
        >
          <p className="eyebrow">SKLEP • SPRZEDAŻ</p>
          <h2>Wybierz przedmiot</h2>
          <p className="muted">
            Sprzedaje:{' '}
            <strong>
              {characters.find(character => character.id === shopCharacterId)?.name ?? 'Postać'}
            </strong>
          </p>

          <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
            {sortInventoryForDisplay(
              itemsForCharacter(shopCharacterId).filter(
                item => !isCoinInventoryItem(item)
              )
            ).map(item => (
              <button
                key={`shop-sell-${item.id}`}
                className="secondary"
                onClick={() => {
                  setShowShopSellPicker(false)
                  openSellItem('character', item)
                }}
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  textAlign: 'left',
                }}
              >
                <span>
                  {inventoryCategoryMarker(item)}
                  <strong>{inventoryDisplayName(item)}</strong>
                </span>
                <span className="muted">ilość: {item.quantity}</span>
              </button>
            ))}

            {itemsForCharacter(shopCharacterId).filter(
              item => !isCoinInventoryItem(item)
            ).length === 0 && (
              <p className="muted">Brak przedmiotów możliwych do sprzedaży.</p>
            )}
          </div>
        </Modal>
      )}

      {showBuyItem && (
        <Modal onClose={() => setShowBuyItem(false)}>
          <p className="eyebrow">ZAKUP</p>
          <h2>Kup przedmiot</h2>

          <label>
            Przedmiot z Biblioteki
            <select
              value={buyCatalogItemId}
              onChange={e => {
                const nextId = e.target.value
                const nextItem = catalog.find(entry => entry.id === nextId)
                const nextIsRations = isRationCatalogItem(nextItem)

                setBuyCatalogItemId(nextId)
                setBuyQuantity(nextIsRations ? 3 : 1)
                setBuyGp(0)
                setBuySp(nextIsRations ? 5 : 0)
                setBuyCp(0)
                setBuyContainerContent('')
                setBuyContainerFill(0)
              }}
            >
              <option value="">— wybierz —</option>
              {shopCatalogOptions.map(entry => (
                <option key={entry.id} value={entry.id}>
                  {entry.category === 'container'
                    ? containerBaseName(
                        entry.name,
                        entry.containerContent
                      )
                    : entry.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Ilość
            <input
              type="number"
              min={
                isRationCatalogItem(
                  catalog.find(entry => entry.id === buyCatalogItemId)
                )
                  ? 3
                  : 1
              }
              step={
                isRationCatalogItem(
                  catalog.find(entry => entry.id === buyCatalogItemId)
                )
                  ? 3
                  : 1
              }
              value={buyQuantity}
              onChange={e => {
                const next = Number(e.target.value) || 1
                const selectedItem = catalog.find(
                  entry => entry.id === buyCatalogItemId
                )

                if (isRationCatalogItem(selectedItem)) {
                  const normalized = normalizeRationBuyQuantity(next)
                  const totalCp = rationBuyPriceCp(normalized)

                  setBuyQuantity(normalized)
                  setBuyGp(Math.floor(totalCp / 100))
                  setBuySp(Math.floor((totalCp % 100) / 10))
                  setBuyCp(totalCp % 10)
                } else {
                  setBuyQuantity(Math.max(1, Math.floor(next)))
                }
              }}
            />
            {isRationCatalogItem(
              catalog.find(entry => entry.id === buyCatalogItemId)
            ) && (
              <span className="muted" style={{ display: 'block', marginTop: 4 }}>
                Racje są sprzedawane wyłącznie w paczkach po 3.
              </span>
            )}
          </label>

          {catalog.find(
            entry => entry.id === buyCatalogItemId
          )?.category === 'container' && (
            <div
              style={{
                display: 'grid',
                gap: 10,
                marginBottom: 12,
                padding: '12px 14px',
                borderRadius: 9,
                border: '1px solid rgba(175, 132, 58, 0.48)',
                background:
                  'linear-gradient(180deg, rgba(73, 50, 21, 0.18), rgba(22, 18, 13, 0.72))',
              }}
            >
              <div>
                <strong style={{ color: '#e6c782' }}>
                  Zawartość pojemnika
                </strong>
                <span
                  className="muted"
                  style={{ display: 'block', marginTop: 3 }}
                >
                  Pojemnik jest domyślnie pusty. Zostaw substancję pustą,
                  aby kupić pusty pojemnik.
                </span>
              </div>

              <label style={{ margin: 0 }}>
                Substancja
                <input
                  value={buyContainerContent}
                  onChange={e => {
                    const value = e.target.value
                    setBuyContainerContent(value)
                    if (!value.trim()) {
                      setBuyContainerFill(0)
                    }
                  }}
                  placeholder="np. Miner's Putty albo Glow Paste"
                />
              </label>

              <label style={{ margin: 0 }}>
                Ilość zawartości
                <input
                  type="number"
                  min="0"
                  max={
                    catalog.find(
                      entry => entry.id === buyCatalogItemId
                    )?.maxUses ?? 0
                  }
                  step="1"
                  value={buyContainerFill}
                  disabled={!buyContainerContent.trim()}
                  onChange={e => {
                    const capacity =
                      catalog.find(
                        entry => entry.id === buyCatalogItemId
                      )?.maxUses ?? 0

                    setBuyContainerFill(
                      Math.max(
                        0,
                        Math.min(
                          capacity,
                          Math.floor(
                            Number(e.target.value) || 0
                          )
                        )
                      )
                    )
                  }}
                />
                <span
                  className="muted"
                  style={{ display: 'block', marginTop: 4 }}
                >
                  {buyContainerFill}/
                  {catalog.find(
                    entry => entry.id === buyCatalogItemId
                  )?.maxUses ?? 0}
                </span>
              </label>

              <div
                style={{
                  fontSize: 13,
                  color: '#c6a96e',
                }}
              >
                Nazwa po zakupie:{' '}
                <strong>
                  {(() => {
                    const selected = catalog.find(
                      entry => entry.id === buyCatalogItemId
                    )
                    if (!selected) return 'Pojemnik'
                    const base = containerBaseName(
                      selected.name,
                      selected.containerContent
                    )
                    return buyContainerContent.trim() &&
                      buyContainerFill > 0
                      ? `${base} - ${buyContainerContent.trim()}`
                      : base
                  })()}
                </strong>
              </div>
            </div>
          )}

          <div
            style={{
              padding: '10px 12px',
              border: '1px solid rgba(197, 148, 58, 0.42)',
              borderRadius: 8,
              background: 'rgba(93, 67, 29, 0.13)',
            }}
          >
            <span className="muted">Płaci</span>
            <strong style={{ display: 'block', marginTop: 4 }}>
              {characters.find(character => character.id === buyCharacterId)?.name ?? '—'}
              {' • '}
              {Number(
                (characters.find(character => character.id === buyCharacterId)?.gold ?? 0).toFixed(2)
              )} GP
            </strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <label>
              GP
              <input
                type="number"
                min="0"
                value={
                  isRationCatalogItem(
                    catalog.find(entry => entry.id === buyCatalogItemId)
                  )
                    ? Math.floor(rationBuyPriceCp(buyQuantity) / 100)
                    : buyGp
                }
                disabled={isRationCatalogItem(
                  catalog.find(entry => entry.id === buyCatalogItemId)
                )}
                onChange={e =>
                  setBuyGp(Math.max(0, Number(e.target.value) || 0))
                }
              />
            </label>
            <label>
              SP
              <input
                type="number"
                min="0"
                value={
                  isRationCatalogItem(
                    catalog.find(entry => entry.id === buyCatalogItemId)
                  )
                    ? Math.floor((rationBuyPriceCp(buyQuantity) % 100) / 10)
                    : buySp
                }
                disabled={isRationCatalogItem(
                  catalog.find(entry => entry.id === buyCatalogItemId)
                )}
                onChange={e =>
                  setBuySp(Math.max(0, Number(e.target.value) || 0))
                }
              />
            </label>
            <label>
              CP
              <input
                type="number"
                min="0"
                value={
                  isRationCatalogItem(
                    catalog.find(entry => entry.id === buyCatalogItemId)
                  )
                    ? rationBuyPriceCp(buyQuantity) % 10
                    : buyCp
                }
                disabled={isRationCatalogItem(
                  catalog.find(entry => entry.id === buyCatalogItemId)
                )}
                onChange={e =>
                  setBuyCp(Math.max(0, Number(e.target.value) || 0))
                }
              />
            </label>
          </div>

          <p className="muted">
            Cena całkowita:{' '}
            {formatMoneyCp(
              isRationCatalogItem(
                catalog.find(entry => entry.id === buyCatalogItemId)
              )
                ? rationBuyPriceCp(buyQuantity)
                : moneyToCp(buyGp, buySp, buyCp)
            )}
            {' • '}1 GP = 10 SP = 100 CP.
          </p>

          {isRationCatalogItem(
            catalog.find(entry => entry.id === buyCatalogItemId)
          ) && (
            <div
              style={{
                marginBottom: 12,
                padding: '9px 11px',
                borderRadius: 7,
                border: '1px solid rgba(197, 148, 58, 0.48)',
                background: 'rgba(104, 76, 31, 0.14)',
              }}
            >
              <strong>Stała cena racji: 5 SP za 3 racje.</strong>
              <span
                className="muted"
                style={{ display: 'block', marginTop: 3 }}
              >
                Cena jest zablokowana i przelicza się automatycznie dla kolejnych
                paczek po 3.
              </span>
            </div>
          )}

          <button
            className="primary full"
            onClick={executeBuyItem}
            disabled={buyingItem || !buyCatalogItemId || !buyCharacterId}
          >
            {buyingItem ? 'Kupowanie…' : 'Kup'}
          </button>
        </Modal>
      )}

      {showSellItem && (
        <Modal onClose={() => setShowSellItem(false)}>
          <p className="eyebrow">SPRZEDAŻ</p>
          <h2>Sprzedaj: {sellItemName}</h2>

          <label>
            Ilość
            <input
              type="number"
              min="1"
              max={sellMaxQuantity}
              value={sellQuantity}
              onChange={e =>
                setSellQuantity(
                  Math.min(sellMaxQuantity, Math.max(1, Number(e.target.value) || 1))
                )
              }
            />
          </label>

          <div
            style={{
              padding: '10px 12px',
              border: '1px solid rgba(197, 148, 58, 0.42)',
              borderRadius: 8,
              background: 'rgba(93, 67, 29, 0.13)',
            }}
          >
            <span className="muted">Pieniądze otrzymuje</span>
            <strong style={{ display: 'block', marginTop: 4 }}>
              {characters.find(character => character.id === sellCharacterId)?.name ?? '—'}
            </strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <label>
              GP
              <input type="number" min="0" value={sellGp} onChange={e => setSellGp(Math.max(0, Number(e.target.value) || 0))} />
            </label>
            <label>
              SP
              <input type="number" min="0" value={sellSp} onChange={e => setSellSp(Math.max(0, Number(e.target.value) || 0))} />
            </label>
            <label>
              CP
              <input type="number" min="0" value={sellCp} onChange={e => setSellCp(Math.max(0, Number(e.target.value) || 0))} />
            </label>
          </div>

          <p className="muted">
            Cena całkowita: {formatMoneyCp(moneyToCp(sellGp, sellSp, sellCp))}
            {' • '}1 GP = 10 SP = 100 CP.
          </p>

          <button
            className="primary full"
            onClick={executeSellItem}
            disabled={sellingItem || !sellCharacterId}
          >
            {sellingItem ? 'Sprzedawanie…' : 'Sprzedaj'}
          </button>
        </Modal>
      )}

      {showBastion && (
        <Modal onClose={() => setShowBastion(false)}>
          <p className="eyebrow">NOWY BASTION</p>
          <h2>Zbuduj bastion</h2>

          <label>
            Nazwa bastionu
            <input autoFocus value={bastionName} onChange={e => setBastionName(e.target.value)} />
          </label>

          <label>
            Właściciel
            <select value={bastionOwnerId} onChange={e => setBastionOwnerId(e.target.value)}>
              {activeCharacters.map(character => (
                <option key={character.id} value={character.id}>{character.name}</option>
              ))}
            </select>
          </label>

          <label>
            Typ
            <select value={bastionTypeId} onChange={e => setBastionTypeId(e.target.value as BastionTypeId)}>
              {BASTION_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} • {type.cost.toLocaleString('pl-PL')} gp • AC {type.ac} • HP {type.hp}
                </option>
              ))}
            </select>
          </label>

          {(() => {
            const type = BASTION_TYPES.find(item => item.id === bastionTypeId) ?? BASTION_TYPES[0]
            return <p className="muted">Budowa: {type.buildTime} • limit ulepszeń: {type.upgrades}. Koszt zostanie automatycznie odjęty od złota właściciela.</p>
          })()}

          <button className="primary full" onClick={saveBastion} disabled={!bastionName.trim() || !bastionOwnerId}>
            Dodaj bastion
          </button>
        </Modal>
      )}

      {showBastionHp && editingBastionHp && (
        <Modal onClose={() => { setShowBastionHp(false); setEditingBastionHp(null) }}>
          <p className="eyebrow">HP BASTIONU</p>
          <h2>{editingBastionHp.name}</h2>
          <label>
            Aktualne HP
            <input type="number" min="0" max={editingBastionHp.maxHp} value={bastionHpValue} onChange={e => setBastionHpValue(Number(e.target.value) || 0)} />
          </label>
          <p className="muted">0 HP oznacza przełamanie murów bastionu.</p>
          <button className="primary full" onClick={saveBastionHp}>Zapisz HP</button>
        </Modal>
      )}

      {showBastionRepair && repairingBastion && (
        <Modal onClose={() => { setShowBastionRepair(false); setRepairingBastion(null) }}>
          <p className="eyebrow">NAPRAWA</p>
          <h2>{repairingBastion.name}</h2>
          <label>
            HP do naprawy
            <input type="number" min="1" max={Math.max(1, repairingBastion.maxHp-repairingBastion.currentHp)} value={bastionRepairHp} onChange={e => setBastionRepairHp(Math.max(1, Number(e.target.value) || 1))} />
          </label>
          <p className="muted">Koszt: {bastionRepairHp} gp • czas: 1 tydzień. Zasada: 1 gp za każde odzyskane HP.</p>
          <button className="primary full" onClick={saveBastionRepair}>Napraw</button>
        </Modal>
      )}

      {showBastionUpgrade && upgradingBastion && (
        <Modal onClose={() => { setShowBastionUpgrade(false); setUpgradingBastion(null) }}>
          <p className="eyebrow">ULEPSZENIE BASTIONU</p>
          <h2>{upgradingBastion.name}</h2>
          <label>
            Ulepszenie
            <select value={bastionUpgradeId} onChange={e => setBastionUpgradeId(e.target.value)}>
              {BASTION_UPGRADES
                .filter(rule => !upgradesForBastion(upgradingBastion.id).some(installed => installed.upgradeId === rule.id))
                .map(rule => (
                  <option key={rule.id} value={rule.id}>{rule.name} • {rule.cost} gp</option>
                ))}
            </select>
          </label>
          {(() => {
            const rule = BASTION_UPGRADES.find(item => item.id === bastionUpgradeId)
            return rule ? <p className="muted">{rule.description} • Budowa: 1 tydzień. Koszt zostanie odjęty od złota właściciela.</p> : null
          })()}
          <button className="primary full" onClick={saveBastionUpgrade} disabled={!bastionUpgradeId}>Dodaj ulepszenie</button>
        </Modal>
      )}

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

      {showStoryCharacter && (
        <Modal
          onClose={() => {
            setShowStoryCharacter(false)
            setEditingStoryCharacter(null)
          }}
        >
          <p className="eyebrow">
            {editingStoryCharacter ? 'EDYCJA POSTACI FABULARNEJ' : 'NOWA POSTAĆ FABULARNA'}
          </p>
          <h2>
            {editingStoryCharacter ? 'Edytuj Postać Fabularną' : 'Dodaj Postać Fabularną'}
          </h2>

          <label>
            Imię
            <input
              autoFocus
              value={storyCharacterName}
              onChange={e => setStoryCharacterName(e.target.value)}
              placeholder="np. Matka Eris"
            />
          </label>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            <label>
              Lokalizacja
              <input
                value={storyCharacterLocation}
                onChange={e => setStoryCharacterLocation(e.target.value)}
                placeholder="np. Brannoch, Stary Rynek"
              />
            </label>

            <label>
              Czas spotkania
              <input
                value={storyCharacterMeetingTime}
                onChange={e => setStoryCharacterMeetingTime(e.target.value)}
                placeholder="np. Sesja 3 / 12 dzień Jesieni"
              />
            </label>

            <label>
              Frakcja
              <input
                value={storyCharacterFaction}
                onChange={e => setStoryCharacterFaction(e.target.value)}
                placeholder="np. Gildia Kupców"
              />
            </label>

            <label>
              Zadanie
              <input
                value={storyCharacterQuest}
                onChange={e => setStoryCharacterQuest(e.target.value)}
                placeholder="np. Zaginiony konwój"
              />
            </label>
          </div>

          <label>
            Okoliczności spotkania
            <textarea
              rows={6}
              value={storyCharacterCircumstances}
              onChange={e => setStoryCharacterCircumstances(e.target.value)}
              placeholder="Gdzie i dlaczego bohaterowie ją poznali, co wtedy robiła, co się wydarzyło..."
            />
          </label>

          <button
            className="primary full"
            onClick={saveStoryCharacter}
            disabled={!storyCharacterName.trim()}
          >
            {editingStoryCharacter ? 'Zapisz zmiany' : 'Dodaj Postać Fabularną'}
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
          <p className="eyebrow">{editingNpcItem ? 'EDYCJA PRZEDMIOTU NPC' : 'PODNIEŚ PRZEDMIOT NPC'}</p>
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
            {editingNpcItem ? 'Zapisz zmiany' : 'Podnieś przedmiot'}
          </button>
        </Modal>
      )}

      {showCharacter && (
        <div
          className="modal-backdrop"
          onMouseDown={() => {
            setShowCharacter(false)
            setEditingCharacter(null)
          }}
          style={{
            padding: 8,
            overflow: 'auto',
            alignItems: 'flex-start',
          }}
        >
          <div
            className="character-edit-modal parchment-panel"
            onMouseDown={e => e.stopPropagation()}
            style={{
              width: 'min(1540px, calc(100vw - 16px))',
              minHeight: 'calc(100vh - 16px)',
              maxHeight: 'none',
              margin: '0 auto',
              padding: 18,
              borderRadius: 8,
              position: 'relative',
              overflow: 'visible',
            }}
          >
            <style>{`
              .character-edit-modal {
                --field-bg: rgba(13, 12, 10, 0.94);
                --field-border: rgba(145, 104, 42, 0.76);
                --field-text: #ead8ad;
                --field-muted: #aa9874;
              }
              .character-edit-modal label {
                color: var(--field-muted);
                font-size: 12px;
                line-height: 1.25;
              }
              .character-edit-modal input,
              .character-edit-modal textarea,
              .character-edit-modal select {
                width: 100%;
                box-sizing: border-box;
                margin-top: 5px;
                border: 1px solid var(--field-border) !important;
                border-radius: 5px !important;
                background: var(--field-bg) !important;
                color: var(--field-text) !important;
                box-shadow: inset 0 1px 3px rgba(0,0,0,.58) !important;
                outline: none !important;
                font: inherit;
              }
              .character-edit-modal input,
              .character-edit-modal select {
                min-height: 38px;
                padding: 7px 10px;
              }
              .character-edit-modal textarea {
                min-height: 118px;
                padding: 9px 10px;
                resize: vertical;
              }
              .character-edit-modal input:focus,
              .character-edit-modal textarea:focus,
              .character-edit-modal select:focus {
                border-color: rgba(211, 163, 70, .94) !important;
                box-shadow: 0 0 0 2px rgba(170, 119, 39, .15),
                  inset 0 1px 3px rgba(0,0,0,.58) !important;
              }
              .character-edit-modal input::placeholder,
              .character-edit-modal textarea::placeholder {
                color: rgba(190, 170, 132, .46);
              }
              .character-edit-modal input[type="number"] {
                color-scheme: dark;
              }
              .character-edit-modal select {
                color-scheme: dark;
              }
              @media (max-width: 1120px) {
                .character-editor-top,
                .character-editor-middle,
                .character-editor-stats,
                .character-editor-bottom {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>

            <button
              className="close"
              onClick={() => {
                setShowCharacter(false)
                setEditingCharacter(null)
              }}
              style={{ top: 12, right: 12 }}
            >
              <X />
            </button>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                paddingRight: 42,
                marginBottom: 14,
              }}
            >
              <div>
                <p className="eyebrow" style={{ marginBottom: 3 }}>
                  {editingCharacter ? 'EDYCJA POSTACI' : 'NOWA POSTAĆ'}
                </p>
                <h2 style={{ margin: 0 }}>
                  {editingCharacter ? 'Edytuj postać' : 'Dodaj postać'}
                </h2>
              </div>
            </div>

            <div
              className="character-editor-top"
              style={{
                display: 'grid',
                gridTemplateColumns: '280px minmax(0, 1.45fr) minmax(280px, .9fr)',
                gap: 14,
                alignItems: 'stretch',
              }}
            >
              <section
                style={{
                  border: '1px solid rgba(180,135,60,.34)',
                  borderRadius: 7,
                  padding: 8,
                  background: 'rgba(20,17,13,.52)',
                }}
              >
                <div
                  style={{
                    aspectRatio: '4 / 5',
                    border: '1px solid rgba(197,148,58,.58)',
                    borderRadius: 6,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(8,8,7,.9)',
                  }}
                >
                  {editingCharacter?.portraitUrl ? (
                    <img
                      src={editingCharacter.portraitUrl}
                      alt={`Portret ${editingCharacter.name}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div className="muted" style={{ textAlign: 'center' }}>
                      <Users size={42} />
                      <div style={{ marginTop: 8 }}>PORTRET</div>
                    </div>
                  )}
                </div>

                {editingCharacter ? (
                  <label
                    className="secondary"
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: 8,
                      cursor: 'pointer',
                    }}
                  >
                    <Users size={15} />
                    Zmień portret
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) void uploadCharacterPortrait(editingCharacter, file)
                        e.currentTarget.value = ''
                      }}
                    />
                  </label>
                ) : (
                  <div className="muted" style={{ textAlign: 'center', marginTop: 10 }}>
                    Portret dodasz po zapisaniu postaci.
                  </div>
                )}

                <div className="muted" style={{ textAlign: 'center', fontSize: 11, marginTop: 6 }}>
                  PNG / JPG / WEBP • maks. 5 MB
                </div>
              </section>

              <section
                style={{
                  border: '1px solid rgba(180,135,60,.34)',
                  borderRadius: 7,
                  padding: 12,
                  background: 'rgba(20,17,13,.52)',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
                  <label>
                    Imię postaci
                    <input
                      autoFocus
                      value={characterName}
                      onChange={e => setCharacterName(e.target.value)}
                      placeholder="np. Rosarien"
                    />
                  </label>

                  <label>
                    Ancestry / Pochodzenie
                    <input
                      value={characterAncestry}
                      onChange={e => setCharacterAncestry(e.target.value)}
                      placeholder="np. Wood Elf"
                    />
                  </label>

                  <label>
                    Class / Klasa
                    <input
                      value={characterClassName}
                      onChange={e => setCharacterClassName(e.target.value)}
                      placeholder="np. Ranger"
                    />
                  </label>

                  <label>
                    Level / Poziom
                    <input
                      type="number"
                      min="1"
                      value={characterLevel}
                      onChange={e => setCharacterLevel(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                    />
                  </label>

                  <label>
                    Title / Tytuł
                    <input
                      value={characterTitle}
                      onChange={e => setCharacterTitle(e.target.value)}
                      placeholder="np. Stranger"
                    />
                  </label>

                  <label>
                    Alignment / Charakter
                    <input
                      value={characterAlignment}
                      onChange={e => setCharacterAlignment(e.target.value)}
                      placeholder="np. Neutral"
                    />
                  </label>

                  <label>
                    Background / Pochodzenie społeczne
                    <input
                      value={characterBackground}
                      onChange={e => setCharacterBackground(e.target.value)}
                      placeholder="np. Mercenary"
                    />
                  </label>

                  <label>
                    Deity / Bóstwo
                    <input
                      value={characterDeity}
                      onChange={e => setCharacterDeity(e.target.value)}
                      placeholder="np. Gede"
                    />
                  </label>

                  <label>
                    XP do następnego poziomu
                    <input
                      type="number"
                      min="1"
                      value={characterXpNext}
                      onChange={e => setCharacterXpNext(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto auto auto', gap: 7, alignItems: 'end', marginTop: 10 }}>
                  <label>
                    XP
                    <input
                      type="number"
                      min="0"
                      value={characterXp}
                      onChange={e => setCharacterXp(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                    />
                  </label>
                  {[-10, -1, 1, 10].map(delta => (
                    <button
                      key={delta}
                      className="secondary"
                      type="button"
                      onClick={() => setCharacterXp(value => Math.max(0, value + delta))}
                      style={{ minHeight: 38, minWidth: 48 }}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>
              </section>

              <section
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
                  gridTemplateRows: '1fr auto',
                  gap: 8,
                }}
              >
                <div style={{ border: '1px solid rgba(150,58,43,.62)', borderRadius: 7, padding: 12, background: 'rgba(88,25,20,.23)' }}>
                  <span className="muted">HP</span>
                  <strong style={{ display: 'block', fontSize: 25, marginTop: 6 }}>
                    {characterCurrentHp}/{characterMaxHp + characterTemporaryHp}
                  </strong>
                </div>

                <div style={{ border: '1px solid rgba(62,103,145,.62)', borderRadius: 7, padding: 12, background: 'rgba(23,45,67,.25)' }}>
                  <span className="muted">AC</span>
                  <strong style={{ display: 'block', fontSize: 25, marginTop: 6 }}>
                    {editingCharacter ? armorClassForCharacter(editingCharacter) : 10 + statModifier(characterDexterity)}
                  </strong>
                </div>

                <div style={{ border: '1px solid rgba(98,116,47,.62)', borderRadius: 7, padding: 12, background: 'rgba(54,67,28,.22)' }}>
                  <span className="muted">W RĘKACH</span>
                  <strong style={{ display: 'block', marginTop: 6, lineHeight: 1.35 }}>
                    {editingCharacter ? handsDisplayForCharacter(editingCharacter.id) : '—'}
                  </strong>
                </div>

                <div
                  style={{
                    gridColumn: '1 / -1',
                    border: '1px solid rgba(180,135,60,.34)',
                    borderRadius: 7,
                    padding: 12,
                    background: 'rgba(20,17,13,.52)',
                  }}
                >
                  <div className="slot-line">
                    <span>SLOTY EKWIPUNKU</span>
                    <b>
                      {editingCharacter
                        ? `${Number(usedSlotsForCharacter(editingCharacter.id).toFixed(2))}/${Math.max(10, characterStrength)}`
                        : `0/${Math.max(10, characterStrength)}`}
                    </b>
                  </div>
                  <div className="progress small">
                    <i
                      style={{
                        width: editingCharacter
                          ? `${Math.min(100, (usedSlotsForCharacter(editingCharacter.id) / Math.max(10, characterStrength)) * 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div
              className="character-editor-middle"
              style={{
                display: 'grid',
                gridTemplateColumns: '.9fr 1.05fr 1.15fr',
                gap: 12,
                marginTop: 12,
              }}
            >
              <section style={{ border: '1px solid rgba(180,135,60,.34)', borderRadius: 7, padding: 12, background: 'rgba(20,17,13,.52)' }}>
                <div className="panel-title">STATYSTYKI</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 76px 94px', gap: 8, paddingBottom: 6, borderBottom: '1px solid rgba(180,135,60,.28)' }}>
                  <span className="muted">STAT</span>
                  <span className="muted" style={{ textAlign: 'right' }}>WARTOŚĆ</span>
                  <span className="muted" style={{ textAlign: 'right' }}>MODYFIKATOR</span>
                </div>
                {[
                  ['SIŁA', characterStrength, setCharacterStrength],
                  ['ZRĘCZNOŚĆ', characterDexterity, setCharacterDexterity],
                  ['KONDYCJA', characterConstitution, setCharacterConstitution],
                  ['INTELIGENCJA', characterIntelligence, setCharacterIntelligence],
                  ['MĄDROŚĆ', characterWisdom, setCharacterWisdom],
                  ['CHARYZMA', characterCharisma, setCharacterCharisma],
                ].map(([label, value, setter]) => (
                  <div
                    key={String(label)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 76px 94px',
                      gap: 8,
                      alignItems: 'center',
                      padding: '5px 0',
                      borderBottom: '1px solid rgba(180,135,60,.18)',
                    }}
                  >
                    <strong>{String(label)}</strong>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={Number(value)}
                      onChange={e =>
                        (setter as (v: number) => void)(
                          Math.min(30, Math.max(1, Number(e.target.value) || 1))
                        )
                      }
                      style={{ minHeight: 30, marginTop: 0, textAlign: 'right', padding: '4px 7px' }}
                    />
                    <strong style={{ textAlign: 'right' }}>
                      {formatModifier(statModifier(Number(value)))}
                    </strong>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                  <div style={{ border: '1px solid rgba(180,135,60,.26)', borderRadius: 6, padding: 8 }}>
                    <span className="muted">Sloty ekwipunku</span>
                    <strong style={{ display: 'block', marginTop: 4 }}>{Math.max(10, characterStrength)}</strong>
                  </div>
                  <div style={{ border: '1px solid rgba(180,135,60,.26)', borderRadius: 6, padding: 8 }}>
                    <span className="muted">Quickpull (DEX)</span>
                    <strong style={{ display: 'block', marginTop: 4 }}>{Math.max(0, statModifier(characterDexterity))}</strong>
                  </div>
                </div>
              </section>

              <section style={{ border: '1px solid rgba(180,135,60,.34)', borderRadius: 7, padding: 12, background: 'rgba(20,17,13,.52)' }}>
                <div className="panel-title">TALENTY / ZAKLĘCIA / JĘZYKI / BIEGŁOŚCI</div>
                <label>
                  Wpisy postaci
                  <textarea
                    value={characterTalentsSpells}
                    onChange={e => setCharacterTalentsSpells(e.target.value)}
                    placeholder={'Np. WEAPONS: Dagger, Longbow...\nLANGUAGES: Common, Elvish...\nRanger: HERBALISM, WAYFINDER...'}
                    style={{ minHeight: 270 }}
                  />
                </label>
              </section>

              <section style={{ border: '1px solid rgba(180,135,60,.34)', borderRadius: 7, padding: 12, background: 'rgba(20,17,13,.52)' }}>
                <div className="panel-title">HISTORIA POSTACI</div>
                <label>
                  Historia, cele, relacje i notatki
                  <textarea
                    value={characterBackstory}
                    onChange={e => setCharacterBackstory(e.target.value)}
                    placeholder="Historia, ważne wydarzenia, cele, relacje, notatki..."
                    style={{ minHeight: 270 }}
                  />
                </label>
              </section>
            </div>

            <div
              className="character-editor-bottom"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
                gap: 12,
                marginTop: 12,
                alignItems: 'end',
              }}
            >
              <section style={{ border: '1px solid rgba(180,135,60,.34)', borderRadius: 7, padding: 12, background: 'rgba(20,17,13,.52)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
                  <label>
                    Bazowe maksymalne HP
                    <input
                      type="number"
                      min="1"
                      value={characterMaxHp}
                      onChange={e => {
                        const next = Math.max(1, Math.floor(Number(e.target.value) || 1))
                        setCharacterMaxHp(next)
                        setCharacterCurrentHp(current =>
                          Math.min(current, next + characterTemporaryHp)
                        )
                      }}
                    />
                  </label>
                  <label>
                    Aktualne HP
                    <input
                      type="number"
                      min="0"
                      max={characterMaxHp + characterTemporaryHp}
                      value={characterCurrentHp}
                      onChange={e =>
                        setCharacterCurrentHp(
                          Math.min(
                            characterMaxHp + characterTemporaryHp,
                            Math.max(0, Math.floor(Number(e.target.value) || 0))
                          )
                        )
                      }
                    />
                  </label>
                  <label style={{ gridColumn: '1 / -1' }}>
                    Tymczasowe HP
                    <input
                      type="number"
                      min="0"
                      value={characterTemporaryHp}
                      onChange={e => {
                        const next = Math.max(
                          0,
                          Math.floor(Number(e.target.value) || 0)
                        )
                        setCharacterTemporaryHp(next)
                        setCharacterCurrentHp(current =>
                          Math.min(current, characterMaxHp + next)
                        )
                      }}
                    />
                  </label>
                </div>
              </section>

              <section style={{ border: '1px solid rgba(180,135,60,.34)', borderRadius: 7, padding: 12, background: 'rgba(20,17,13,.52)' }}>
                <label>
                  Złoto (postać)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={characterGold}
                    onChange={e => setCharacterGold(Math.max(0, Number(e.target.value) || 0))}
                  />
                </label>
              </section>

              <section
                style={{
                  border: '1px solid rgba(180,135,60,.34)',
                  borderRadius: 7,
                  padding: 12,
                  background: 'rgba(20,17,13,.52)',
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  minHeight: 66,
                }}
              >
                <button
                  className="secondary"
                  type="button"
                  onClick={() => {
                    setShowCharacter(false)
                    setEditingCharacter(null)
                  }}
                >
                  Anuluj
                </button>
                <button className="secondary" type="button" onClick={resetCharacterDraft}>
                  Resetuj zmiany
                </button>
                <button
                  className="primary"
                  onClick={saveCharacter}
                  disabled={!characterName.trim()}
                  style={{ minWidth: 150 }}
                >
                  {editingCharacter ? 'Zapisz postać' : 'Dodaj postać'}
                </button>
              </section>
            </div>
          </div>
        </div>
      )}

      {showItem && (
        <Modal
          onClose={() => {
            setShowItem(false)
            setEditingItem(null)
          }}
        >
          <p className="eyebrow">
            {editingItem ? 'EDYCJA PRZEDMIOTU' : 'PODNIEŚ PRZEDMIOT'}
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
            {editingItem ? 'Zapisz zmiany' : 'Podnieś przedmiot'}
          </button>
        </Modal>
      )}

      {showCatalogItem && (
        <Modal
          onClose={() => {
            setShowCatalogItem(false)
            setEditingCatalogItem(null)
          }}
        >
          <p className="eyebrow">KATALOG KAMPANII</p>
          <h2>
            {editingCatalogItem
              ? `Edytuj: ${editingCatalogItem.name}`
              : 'Nowy przedmiot katalogowy'}
          </h2>

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
              <option value="container">Pojemnik</option>
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

          <label>
            {catalogCategory === 'container'
              ? 'Pojemność pojemnika'
              : 'Liczba użyć'}
            <input
              type="number"
              min="0"
              step="1"
              value={catalogMaxUses}
              onChange={e =>
                setCatalogMaxUses(
                  Math.max(0, Math.floor(Number(e.target.value) || 0))
                )
              }
            />
            <span className="muted" style={{ display: 'block', marginTop: 4 }}>
              {catalogCategory === 'container'
                ? 'Maksymalna liczba jednostek zawartości.'
                : '0 = przedmiot bez licznika użyć.'}
            </span>
          </label>

          {catalogCategory === 'container' && (
            <div
              style={{
                display: 'grid',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid rgba(175, 132, 58, 0.48)',
                background:
                  'linear-gradient(180deg, rgba(73, 50, 21, 0.18), rgba(22, 18, 13, 0.72))',
              }}
            >
              <div>
                <strong
                  style={{
                    display: 'block',
                    color: '#e6c782',
                    marginBottom: 3,
                  }}
                >
                  {fillingContainerItem
                    ? 'Napełnianie pojemnika'
                    : 'Pusty pojemnik'}
                </strong>
                <span className="muted">
                  {fillingContainerItem
                    ? 'Wybierz substancję i ustaw, ile jednostek znajduje się w tym konkretnym pojemniku.'
                    : `Nowy pojemnik jest zawsze pusty: 0/${catalogMaxUses}. Zawartość ustawisz później przyciskiem „NAPEŁNIJ” w ekwipunku.`}
                </span>
              </div>

              {fillingContainerItem && (
                <>
                  <label style={{ margin: 0 }}>
                    Substancja
                    <input
                      value={catalogContainerContent}
                      onChange={e => {
                        const value = e.target.value
                        setCatalogContainerContent(value)
                        if (!value.trim()) {
                          setCatalogContainerFill(0)
                        }
                      }}
                      placeholder="np. Miner's Putty albo Glow Paste"
                      style={{
                        background: 'rgba(15, 13, 10, 0.96)',
                        color: '#ead6aa',
                        border: '1px solid rgba(164, 122, 52, 0.62)',
                      }}
                    />
                  </label>

                  <label style={{ margin: 0 }}>
                    Aktualne napełnienie
                    <input
                      type="number"
                      min="0"
                      max={catalogMaxUses}
                      step="1"
                      value={catalogContainerFill}
                      disabled={!catalogContainerContent.trim()}
                      onChange={e =>
                        setCatalogContainerFill(
                          Math.max(
                            0,
                            Math.min(
                              catalogMaxUses,
                              Math.floor(
                                Number(e.target.value) || 0
                              )
                            )
                          )
                        )
                      }
                      style={{
                        background: 'rgba(15, 13, 10, 0.96)',
                        color: '#ead6aa',
                        border: '1px solid rgba(164, 122, 52, 0.62)',
                      }}
                    />
                    <span
                      className="muted"
                      style={{ display: 'block', marginTop: 4 }}
                    >
                      {catalogContainerFill}/{catalogMaxUses}
                    </span>
                  </label>
                </>
              )}

              <div
                style={{
                  fontSize: 13,
                  color: '#c6a96e',
                  lineHeight: 1.5,
                }}
              >
                Nazwa w ekwipunku:{' '}
                <strong>
                  {fillingContainerItem &&
                  catalogContainerFill > 0 &&
                  catalogContainerContent.trim()
                    ? `${containerBaseName(
                        catalogName || 'Pojemnik',
                        catalogContainerContent
                      )} - ${catalogContainerContent.trim()}`
                    : containerBaseName(
                        catalogName || 'Pojemnik',
                        catalogContainerContent
                      )}
                </strong>
              </div>
            </div>
          )}

          <label
            style={{
              display: 'grid',
              gap: 7,
              padding: '12px 14px',
              borderRadius: 9,
              border: '1px solid rgba(118, 93, 50, 0.42)',
              background: 'rgba(27, 23, 17, 0.72)',
            }}
          >
            <span>
              <strong>Opis</strong>
              <span
                className="muted"
                style={{ display: 'block', marginTop: 3 }}
              >
                Opcjonalny opis dostępny dla każdego przedmiotu.
              </span>
            </span>
            <textarea
              rows={4}
              value={catalogDescription}
              onChange={e =>
                setCatalogDescription(e.target.value)
              }
              placeholder="Opis przedmiotu, jego wyglądu, działania lub dodatkowych informacji..."
              style={{
                width: '100%',
                resize: 'vertical',
                background: 'rgba(15, 13, 10, 0.96)',
                color: '#ead6aa',
                border: '1px solid rgba(118, 93, 50, 0.58)',
                borderRadius: 7,
                padding: '10px 11px',
                lineHeight: 1.5,
                fontFamily: 'inherit',
                fontSize: 14,
              }}
            />
            <span className="muted">
              Jeśli opis jest wpisany, w ekwipunku pojawi się przycisk „Opis”.
            </span>
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
              <label>
                Wymagane ręce
                <select
                  value={catalogHandsRequired}
                  onChange={e => setCatalogHandsRequired(Number(e.target.value) === 2 ? 2 : 1)}
                  style={themedSelectStyle}
                >
                  <option value={1}>1 ręka</option>
                  <option value={2}>2 ręce</option>
                </select>
              </label>
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

          <label
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              padding: '10px 12px',
              border: '1px solid rgba(210, 122, 39, 0.72)',
              borderRadius: 8,
              background: 'rgba(190, 94, 24, 0.14)',
            }}
          >
            <input
              type="checkbox"
              checked={catalogIsQuestItem}
              onChange={e => setCatalogIsQuestItem(e.target.checked)}
              style={{ width: 'auto', margin: 0 }}
            />
            <span>
              <strong>Przedmiot zadania</strong>
              <span className="muted" style={{ display: 'block', marginTop: 2 }}>
                Oznacz przedmiot pomarańczowym wyróżnieniem w bibliotece, ekwipunku i podsumowaniu.
              </span>
            </span>
          </label>

          {catalogIsMagical && (
            <>
              <div
                style={{
                  padding: '9px 11px',
                  borderRadius: 8,
                  border: catalogMagicDescription.trim()
                    ? '1px solid rgba(84, 143, 77, 0.62)'
                    : '1px solid rgba(199, 151, 55, 0.68)',
                  background: catalogMagicDescription.trim()
                    ? 'rgba(54, 99, 49, 0.16)'
                    : 'rgba(108, 76, 22, 0.16)',
                }}
              >
                <strong>
                  Status:{' '}
                  {catalogMagicDescription.trim()
                    ? 'ZIDENTYFIKOWANY'
                    : 'NIEZIDENTYFIKOWANY'}
                </strong>
                <span
                  className="muted"
                  style={{ display: 'block', marginTop: 3 }}
                >
                  {catalogMagicDescription.trim()
                    ? 'Opis jest uzupełniony. W ekwipunku pojawi się przycisk „Opis”.'
                    : 'Bez opisu przedmiot będzie oznaczony na karcie postaci jako „NIEZIDENTYFIKOWANY”.'}
                </span>
              </div>

              <label>
                Opis magicznych właściwości
                <textarea
                  rows={5}
                  value={catalogMagicDescription}
                  onChange={e => setCatalogMagicDescription(e.target.value)}
                  placeholder="Wpisz właściwości przedmiotu, aby go zidentyfikować..."
                />
              </label>
            </>
          )}

          <button
            className="primary full"
            onClick={saveCatalogItem}
            disabled={!catalogName.trim()}
          >
            {fillingContainerItem
              ? 'Zapisz napełnienie pojemnika'
              : editingCatalogItem
                ? 'Zapisz zmiany w katalogu'
                : 'Dodaj do biblioteki'}
          </button>
          <p className="muted">Przedmiot będzie dostępny wszystkim użytkownikom tej kampanii.</p>
        </Modal>
      )}


      {showCatalogImport && (
        <Modal onClose={() => setShowCatalogImport(false)}>
          <p className="eyebrow">IMPORT BIBLIOTEKI</p>
          <h2>Importuj przedmioty z CSV</h2>
          <p className="muted">
            Każdy wiersz: nazwa;typ;sloty;czas światła;obrażenia;zasięg;właściwości broni;KP/AC;właściwości pancerza;wielkość grupy slotu;darmowa ilość;magiczny;opis magii;przedmiot zadania;wymagane ręce;liczba użyć;opis;zawartość pojemnika.
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
          <p className="muted">Dozwolone typy: normal, food, light, weapon, armor, container. Nazwy już istniejące zostaną pominięte.</p>
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
        style={{
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          scrollbarGutter: 'stable',
        }}
      >
        <button
          className="close"
          onClick={onClose}
          style={{
            position: 'sticky',
            top: 0,
            float: 'right',
            zIndex: 20,
          }}
        >
          <X />
        </button>

        {children}
      </div>
    </div>
  )
}

function StatInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label>
      {label} • mod {formatModifier(statModifier(value))}
      <input
        type="number"
        min="1"
        max="30"
        value={value}
        onChange={e =>
          onChange(Math.min(30, Math.max(1, Number(e.target.value) || 1)))
        }
      />
    </label>
  )
}

function InventoryQuantityInput({
  value,
  disabled = false,
  decimals = false,
  onCommit,
}: {
  value: number
  disabled?: boolean
  decimals?: boolean
  onCommit: (value: number) => void | Promise<void>
}) {
  const formatValue = (input: number) =>
    decimals ? String(Math.round(input * 100) / 100) : String(Math.floor(input))

  const [draft, setDraft] = useState(formatValue(value))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDraft(formatValue(value))
  }, [value, decimals])

  const normalizedDraft = draft.replace(',', '.')
  const parsedRaw = Number(normalizedDraft)
  const parsed = decimals
    ? Math.max(0, Math.round((Number.isFinite(parsedRaw) ? parsedRaw : 0) * 100) / 100)
    : Math.max(0, Math.floor(Number.isFinite(parsedRaw) ? parsedRaw : 0))

  const changed = Math.abs(parsed - value) > 0.0001

  async function commit() {
    if (disabled || !changed || saving) return

    setSaving(true)
    try {
      await onCommit(parsed)
      setDraft(formatValue(parsed))
    } finally {
      setSaving(false)
    }
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        margin: '0 4px',
      }}
    >
      <input
        type="text"
        inputMode={decimals ? 'decimal' : 'numeric'}
        value={draft}
        disabled={disabled || saving}
        onChange={e => {
          const raw = e.target.value.replace(',', '.')
          const next = decimals
            ? raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
            : raw.replace(/[^0-9]/g, '')
          setDraft(next)
        }}
        title={
          disabled
            ? 'Nie można zmieniać ilości aktywnego źródła światła.'
            : decimals
              ? 'Wpisz wartość w GP z dokładnością do 0,01 GP i zatwierdź zielonym ptaszkiem.'
              : 'Wpisz nową ilość i zatwierdź zielonym ptaszkiem.'
        }
        style={{
          width: decimals ? 72 : 58,
          minWidth: decimals ? 72 : 58,
          padding: '5px 7px',
          borderRadius: 6,
          border: '1px solid rgba(138, 101, 48, 0.72)',
          background: disabled
            ? 'rgba(69, 64, 52, 0.58)'
            : 'rgba(18, 16, 13, 0.96)',
          color: disabled
            ? 'rgba(218, 193, 139, 0.48)'
            : '#e6cf9c',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.55)',
          outline: 'none',
          fontWeight: 700,
          textAlign: 'center',
        }}
      />

      <button
        type="button"
        onClick={() => void commit()}
        disabled={disabled || saving || !changed}
        title={changed ? 'Zatwierdź nową ilość' : 'Ilość bez zmian'}
        aria-label="Zatwierdź ilość"
        style={{
          width: 29,
          height: 29,
          minWidth: 29,
          padding: 0,
          borderRadius: 6,
          border: '1px solid rgba(72, 126, 62, 0.88)',
          background: changed
            ? 'linear-gradient(180deg, rgba(54, 104, 48, 0.78), rgba(35, 72, 32, 0.82))'
            : 'rgba(39, 68, 35, 0.26)',
          color: changed ? '#9dd590' : 'rgba(157, 213, 144, 0.35)',
          cursor: disabled || saving || !changed ? 'default' : 'pointer',
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        {saving ? '…' : '✓'}
      </button>
    </span>
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