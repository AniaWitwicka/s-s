import { getModifier, getProficiencyBonus } from './abilities.js'

export const SKILLS = {
  acrobatics:     { ability: 'dex', label: 'Acrobatics' },
  animalHandling: { ability: 'wis', label: 'Animal Handling' },
  arcana:         { ability: 'int', label: 'Arcana' },
  athletics:      { ability: 'str', label: 'Athletics' },
  deception:      { ability: 'cha', label: 'Deception' },
  history:        { ability: 'int', label: 'History' },
  insight:        { ability: 'wis', label: 'Insight' },
  intimidation:   { ability: 'cha', label: 'Intimidation' },
  investigation:  { ability: 'int', label: 'Investigation' },
  medicine:       { ability: 'wis', label: 'Medicine' },
  nature:         { ability: 'int', label: 'Nature' },
  perception:     { ability: 'wis', label: 'Perception' },
  performance:    { ability: 'cha', label: 'Performance' },
  persuasion:     { ability: 'cha', label: 'Persuasion' },
  religion:       { ability: 'int', label: 'Religion' },
  sleightOfHand:  { ability: 'dex', label: 'Sleight of Hand' },
  stealth:        { ability: 'dex', label: 'Stealth' },
  survival:       { ability: 'wis', label: 'Survival' },
}

export const getSkillBonus = (skillId, character) => {
  const skill      = SKILLS[skillId]
  const score      = character.abilities[skill.ability]
  const mod        = getModifier(score)
  const prof       = getProficiencyBonus(character.meta.level)
  const skillData  = character.skills[skillId]
  if (skillData.expertise)  return mod + prof * 2
  if (skillData.proficient) return mod + prof
  return mod
}

export const getAllSkillBonuses = (character) =>
  Object.fromEntries(
    Object.keys(SKILLS).map(id => [id, getSkillBonus(id, character)])
  )
