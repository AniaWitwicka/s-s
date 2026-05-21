import { getModifier, getProficiencyBonus } from './abilities.js'

export const getSpellSaveDC = (abilityScore, level) =>
  8 + getProficiencyBonus(level) + getModifier(abilityScore)

export const getSpellAttackBonus = (abilityScore, level) =>
  getProficiencyBonus(level) + getModifier(abilityScore)

// Full-caster spell slot table (PHB p.165). Index 0 = unused, index N = spell level N.
const FULL_CASTER_SLOTS = {
  1:  [0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
  2:  [0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
  3:  [0, 4, 2, 0, 0, 0, 0, 0, 0, 0],
  4:  [0, 4, 3, 0, 0, 0, 0, 0, 0, 0],
  5:  [0, 4, 3, 2, 0, 0, 0, 0, 0, 0],
  6:  [0, 4, 3, 3, 0, 0, 0, 0, 0, 0],
  7:  [0, 4, 3, 3, 1, 0, 0, 0, 0, 0],
  8:  [0, 4, 3, 3, 2, 0, 0, 0, 0, 0],
  9:  [0, 4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [0, 4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [0, 4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [0, 4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [0, 4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [0, 4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [0, 4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [0, 4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [0, 4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [0, 4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [0, 4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [0, 4, 3, 3, 3, 3, 2, 2, 1, 1],
}

// Half-caster table (Paladin, Ranger)
const HALF_CASTER_SLOTS = {
  1:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  2:  [0, 2, 0, 0, 0, 0, 0, 0, 0, 0],
  3:  [0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
  4:  [0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
  5:  [0, 4, 2, 0, 0, 0, 0, 0, 0, 0],
  6:  [0, 4, 2, 0, 0, 0, 0, 0, 0, 0],
  7:  [0, 4, 3, 0, 0, 0, 0, 0, 0, 0],
  8:  [0, 4, 3, 0, 0, 0, 0, 0, 0, 0],
  9:  [0, 4, 3, 2, 0, 0, 0, 0, 0, 0],
  10: [0, 4, 3, 2, 0, 0, 0, 0, 0, 0],
  11: [0, 4, 3, 3, 0, 0, 0, 0, 0, 0],
  12: [0, 4, 3, 3, 0, 0, 0, 0, 0, 0],
  13: [0, 4, 3, 3, 1, 0, 0, 0, 0, 0],
  14: [0, 4, 3, 3, 1, 0, 0, 0, 0, 0],
  15: [0, 4, 3, 3, 2, 0, 0, 0, 0, 0],
  16: [0, 4, 3, 3, 2, 0, 0, 0, 0, 0],
  17: [0, 4, 3, 3, 3, 1, 0, 0, 0, 0],
  18: [0, 4, 3, 3, 3, 1, 0, 0, 0, 0],
  19: [0, 4, 3, 3, 3, 2, 0, 0, 0, 0],
  20: [0, 4, 3, 3, 3, 2, 0, 0, 0, 0],
}

const WARLOCK_SLOTS = {
  1:  { count: 1, level: 1 },
  2:  { count: 2, level: 1 },
  3:  { count: 2, level: 2 },
  4:  { count: 2, level: 2 },
  5:  { count: 2, level: 3 },
  6:  { count: 2, level: 3 },
  7:  { count: 2, level: 4 },
  8:  { count: 2, level: 4 },
  9:  { count: 2, level: 5 },
  10: { count: 2, level: 5 },
  11: { count: 3, level: 5 },
  12: { count: 3, level: 5 },
  13: { count: 3, level: 5 },
  14: { count: 3, level: 5 },
  15: { count: 3, level: 5 },
  16: { count: 3, level: 5 },
  17: { count: 4, level: 5 },
  18: { count: 4, level: 5 },
  19: { count: 4, level: 5 },
  20: { count: 4, level: 5 },
}

const FULL_CASTERS  = new Set(['bard', 'cleric', 'druid', 'sorcerer', 'wizard'])
const HALF_CASTERS  = new Set(['paladin', 'ranger'])
const PACT_CASTERS  = new Set(['warlock'])

// Classes that prepare spells — can swap which spells are prepared after a long rest
const PREPARED_CASTERS = new Set(['cleric', 'druid', 'paladin', 'wizard'])

// Ability score each prepared caster uses for their prep limit
const PREP_ABILITY = { cleric: 'wis', druid: 'wis', paladin: 'cha', wizard: 'int' }

export const getSpellSlots = (className, level) => {
  const cls = className.toLowerCase()
  if (FULL_CASTERS.has(cls))  return FULL_CASTER_SLOTS[level]  || []
  if (HALF_CASTERS.has(cls))  return HALF_CASTER_SLOTS[level]  || []
  if (PACT_CASTERS.has(cls))  return WARLOCK_SLOTS[level]       || null
  return []
}

export const isSpellcaster    = (className) => {
  const cls = className.toLowerCase()
  return FULL_CASTERS.has(cls) || HALF_CASTERS.has(cls) || PACT_CASTERS.has(cls)
}
export const isPactMagic      = (className) => PACT_CASTERS.has(className.toLowerCase())
export const isPreparedCaster = (className) => PREPARED_CASTERS.has(className.toLowerCase())

// How many spells a prepared caster can have prepared (mod + level; Paladin uses half-level)
export const getMaxPrepared = (className, classLevel, abilityScore) => {
  const cls = className.toLowerCase()
  if (!PREPARED_CASTERS.has(cls)) return 0
  const mod = getModifier(Number(abilityScore) || 10)
  const lvl = cls === 'paladin' ? Math.floor(classLevel / 2) : classLevel
  return Math.max(1, mod + lvl)
}

// Ability key for prep limit of a prepared caster class
export const getPrepAbility = (className) => PREP_ABILITY[className.toLowerCase()] ?? 'wis'
