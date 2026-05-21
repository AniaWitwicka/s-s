import { getModifier, getProficiencyBonus } from './abilities.js'

export const getInitiative    = (dexScore) => getModifier(dexScore)

export const getAttackBonus   = (abilityScore, level, proficient = true) =>
  getModifier(abilityScore) + (proficient ? getProficiencyBonus(level) : 0)

export const getDamageBonus   = (abilityScore) => getModifier(abilityScore)

// Base AC without armour (Unarmored Defense for non-Barbarian/Monk)
export const getUnarmoredAC   = (dexScore) => 10 + getModifier(dexScore)

// Barbarian Unarmored Defense
export const getBarbarianAC   = (dexScore, conScore) =>
  10 + getModifier(dexScore) + getModifier(conScore)

// Monk Unarmored Defense
export const getMonkAC        = (dexScore, wisScore) =>
  10 + getModifier(dexScore) + getModifier(wisScore)

export const getDeathSaveStatus = (successes, failures) => {
  if (successes >= 3) return 'stable'
  if (failures  >= 3) return 'dead'
  return 'dying'
}

// Conditions that affect combat — used by the combat screen to show indicators
export const COMBAT_CONDITIONS = new Set([
  'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened',
  'grappled', 'incapacitated', 'invisible', 'paralyzed', 'petrified',
  'poisoned', 'prone', 'restrained', 'stunned', 'unconscious',
])
