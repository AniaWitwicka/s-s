export const getModifier = (score) => Math.floor((score - 10) / 2)

export const getProficiencyBonus = (level) => Math.ceil(level / 4) + 1

export const getSavingThrow = (score, proficient, level) =>
  getModifier(score) + (proficient ? getProficiencyBonus(level) : 0)

export const getPassivePerception = (wisScore, proficient, level) =>
  10 + getModifier(wisScore) + (proficient ? getProficiencyBonus(level) : 0)

export const formatModifier = (mod) => `${mod >= 0 ? '+' : ''}${mod}`

export const ABILITY_KEYS   = ['str', 'dex', 'con', 'int', 'wis', 'cha']
export const ABILITY_LABELS = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' }
export const ABILITY_NAMES  = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma'
}
