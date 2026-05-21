import { SKILLS } from './engine/skills.js'

// ---------------------------------------------------------------------------
// Default character shape — every new character starts from this template
// ---------------------------------------------------------------------------

function defaultSkills() {
  return Object.fromEntries(
    Object.keys(SKILLS).map(id => [id, { proficient: false, expertise: false }])
  )
}

export function createCharacter(overrides = {}) {
  const id = crypto.randomUUID()
  return {
    id,
    meta: {
      name: 'Unnamed Adventurer',
      class: 'Fighter',
      subclass: '',
      race: 'Human',
      background: 'Soldier',
      alignment: 'Neutral',
      level: 1,
      xp: 0,
    },
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrows: { str: false, dex: false, con: false, int: false, wis: false, cha: false },
    skills: defaultSkills(),
    hp: { current: 10, max: 10, temp: 0 },
    deathSaves: { successes: 0, failures: 0 },
    combat: {
      ac: 10,
      initiative: 0,
      speed: 30,
      spellcastingAbility: 'int',
    },
    spellSlots: {
      // keyed by spell level 1–9: { max: N, used: N }
      1: { max: 0, used: 0 },
      2: { max: 0, used: 0 },
      3: { max: 0, used: 0 },
      4: { max: 0, used: 0 },
      5: { max: 0, used: 0 },
      6: { max: 0, used: 0 },
      7: { max: 0, used: 0 },
      8: { max: 0, used: 0 },
      9: { max: 0, used: 0 },
    },
    inventory: [],   // [{ itemIndex, name, quantity, equipped, notes }]
    spellbook: [],   // [{ spellIndex, name, prepared }]
    feats: [],       // [{ featIndex, name, notes }]
    conditions: [],  // [conditionIndex, ...]
    journal: [],     // [{ id, title, body, createdAt }]
    notes: '',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  characters: [],
  activeCharacterId: null,
  activeSkinId: 'default',
  customCSS: '',
}

const subscribers = []

// ---------------------------------------------------------------------------
// Store API
// ---------------------------------------------------------------------------

export const store = {
  getState: () => state,

  getActiveCharacter: () =>
    state.characters.find(c => c.id === state.activeCharacterId) ?? null,

  // dot-notation path update: 'hp.current', 'abilities.str', etc.
  update: (path, value) => {
    setNestedValue(state, path, value)
    persist()
    notify()
  },

  // shallow-merge a patch into the active character's top-level keys
  updateCharacter: (patch) => {
    const char = store.getActiveCharacter()
    if (!char) return
    Object.assign(char, patch)
    persist()
    notify()
  },

  // deep-merge a patch into a nested key on the active character
  updateCharacterPath: (path, value) => {
    const char = store.getActiveCharacter()
    if (!char) return
    setNestedValue(char, path, value)
    persist()
    notify()
  },

  addCharacter: (overrides = {}) => {
    const char = createCharacter(overrides)
    state.characters.push(char)
    if (!state.activeCharacterId) state.activeCharacterId = char.id
    persist()
    notify()
    return char
  },

  deleteCharacter: (id) => {
    state.characters = state.characters.filter(c => c.id !== id)
    if (state.activeCharacterId === id) {
      state.activeCharacterId = state.characters[0]?.id ?? null
    }
    persist()
    notify()
  },

  setActiveCharacter: (id) => {
    state.activeCharacterId = id
    persist()
    notify()
  },

  setActiveSkin: (skinId) => {
    state.activeSkinId = skinId
    persist()
    notify()
  },

  setCustomCSS: (css) => {
    state.customCSS = css
    persist()
    notify()
  },

  subscribe: (fn) => {
    subscribers.push(fn)
    return () => subscribers.splice(subscribers.indexOf(fn), 1)
  },
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function notify() {
  subscribers.forEach(fn => fn(state))
}

function persist() {
  try {
    localStorage.setItem('scroll-and-soul', JSON.stringify(state))
  } catch {
    // localStorage quota exceeded — silently ignore
  }
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.')
  let cur = obj
  for (const key of keys.slice(0, -1)) cur = cur[key]
  cur[keys.at(-1)] = value
}

// ---------------------------------------------------------------------------
// Hydrate from localStorage on startup
// ---------------------------------------------------------------------------

const saved = localStorage.getItem('scroll-and-soul')
if (saved) {
  try {
    Object.assign(state, JSON.parse(saved))
  } catch {
    localStorage.removeItem('scroll-and-soul')
  }
}
