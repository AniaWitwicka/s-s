import { getModifier } from './abilities.js'

export const getAC = (dexScore, armorType = 'none', armorBase = 10) => {
  const dexMod = getModifier(dexScore)
  if (armorType === 'none') return 10 + dexMod
  if (armorType === 'light') return armorBase + dexMod
  if (armorType === 'medium') return armorBase + Math.min(dexMod, 2)
  if (armorType === 'heavy') return armorBase
  return 10 + dexMod
}

export const CONDITIONS = [
  'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened',
  'grappled', 'incapacitated', 'invisible', 'paralyzed', 'petrified',
  'poisoned', 'prone', 'restrained', 'stunned', 'unconscious',
]
