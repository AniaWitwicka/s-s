import { getModifier, getProficiencyBonus } from './abilities.js'

export const getSpellAttackBonus = (character) => {
  const ability = character.spells.spellcastingAbility
  const mod = getModifier(character.abilities[ability])
  return mod + getProficiencyBonus(character.meta.level)
}

export const getSpellSaveDC = (character) => {
  return 8 + getSpellAttackBonus(character)
}

export const SPELL_SCHOOLS = [
  'Abjuration', 'Conjuration', 'Divination', 'Enchantment',
  'Evocation', 'Illusion', 'Necromancy', 'Transmutation',
]

export const getAvailableSpellSlots = (className, level) => {
  const FULL_CASTER_SLOTS = {
    1:  [2,0,0,0,0,0,0,0,0],
    2:  [3,0,0,0,0,0,0,0,0],
    3:  [4,2,0,0,0,0,0,0,0],
    4:  [4,3,0,0,0,0,0,0,0],
    5:  [4,3,2,0,0,0,0,0,0],
    6:  [4,3,3,0,0,0,0,0,0],
    7:  [4,3,3,1,0,0,0,0,0],
    8:  [4,3,3,2,0,0,0,0,0],
    9:  [4,3,3,3,1,0,0,0,0],
    10: [4,3,3,3,2,0,0,0,0],
    11: [4,3,3,3,2,1,0,0,0],
    12: [4,3,3,3,2,1,0,0,0],
    13: [4,3,3,3,2,1,1,0,0],
    14: [4,3,3,3,2,1,1,0,0],
    15: [4,3,3,3,2,1,1,1,0],
    16: [4,3,3,3,2,1,1,1,0],
    17: [4,3,3,3,2,1,1,1,1],
    18: [4,3,3,3,3,1,1,1,1],
    19: [4,3,3,3,3,2,1,1,1],
    20: [4,3,3,3,3,2,2,1,1],
  }

  const HALF_CASTERS = ['Paladin', 'Ranger']
  const FULL_CASTERS = ['Wizard', 'Sorcerer', 'Bard', 'Cleric', 'Druid']

  if (FULL_CASTERS.includes(className)) {
    const row = FULL_CASTER_SLOTS[level] || []
    return row.reduce((acc, slots, i) => {
      if (slots > 0) acc[i + 1] = { total: slots, used: 0 }
      return acc
    }, {})
  }

  if (HALF_CASTERS.includes(className)) {
    const effectiveLevel = Math.floor(level / 2)
    if (effectiveLevel < 1) return {}
    const row = FULL_CASTER_SLOTS[effectiveLevel] || []
    return row.reduce((acc, slots, i) => {
      if (slots > 0) acc[i + 1] = { total: slots, used: 0 }
      return acc
    }, {})
  }

  return {}
}
