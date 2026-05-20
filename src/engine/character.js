export const createCharacter = (overrides = {}) => {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

  return {
    id,
    meta: {
      name: 'New Character',
      class: 'Fighter',
      subclass: '',
      race: 'Human',
      background: 'Soldier',
      alignment: 'True Neutral',
      deity: '',
      xp: 0,
      level: 1,
      portrait: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    abilities: {
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    },
    hp: {
      max: 10, current: 10, temp: 0,
      hitDice: { total: 1, remaining: 1, type: 'd10' },
    },
    deathSaves: { successes: 0, failures: 0 },
    skills: {
      acrobatics:     { proficient: false, expertise: false },
      animalHandling: { proficient: false, expertise: false },
      arcana:         { proficient: false, expertise: false },
      athletics:      { proficient: false, expertise: false },
      deception:      { proficient: false, expertise: false },
      history:        { proficient: false, expertise: false },
      insight:        { proficient: false, expertise: false },
      intimidation:   { proficient: false, expertise: false },
      investigation:  { proficient: false, expertise: false },
      medicine:       { proficient: false, expertise: false },
      nature:         { proficient: false, expertise: false },
      perception:     { proficient: false, expertise: false },
      performance:    { proficient: false, expertise: false },
      persuasion:     { proficient: false, expertise: false },
      religion:       { proficient: false, expertise: false },
      sleightOfHand:  { proficient: false, expertise: false },
      stealth:        { proficient: false, expertise: false },
      survival:       { proficient: false, expertise: false },
    },
    combat: {
      ac: 10,
      speed: 30,
      initiative: 0,
      inspiration: false,
    },
    spells: {
      spellcastingAbility: 'int',
      slots: {},
      known: [],
    },
    inventory: {
      currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
      items: [],
    },
    feats: [],
    proficiencies: {
      armor: [],
      weapons: [],
      tools: [],
      languages: ['Common'],
    },
    notes: {
      backstory: '',
      personalityTraits: '',
      ideals: '',
      bonds: '',
      flaws: '',
      sessionNotes: '',
    },
    conditions: [],
    savingThrowProficiencies: {
      str: false, dex: false, con: false, int: false, wis: false, cha: false,
    },
    ...overrides,
  }
}
