export const getModifier = (score) => Math.floor((score - 10) / 2)

export const getProficiencyBonus = (level) => Math.ceil(level / 4) + 1

export const getSavingThrow = (score, proficient, level) => {
  const mod = getModifier(score)
  return proficient ? mod + getProficiencyBonus(level) : mod
}

export const getPassivePerception = (wisScore, perceptionProficient, level) => {
  const mod = getModifier(wisScore)
  const prof = perceptionProficient ? getProficiencyBonus(level) : 0
  return 10 + mod + prof
}

export const getInitiative = (dexScore) => getModifier(dexScore)

export const ABILITY_LABELS = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

export const ABILITY_ABBREVS = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
}

export const SAVING_THROW_ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha']
