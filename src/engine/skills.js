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
  const skill = SKILLS[skillId]
  if (!skill) return 0
  const abilityScore = character.abilities[skill.ability]
  const mod = getModifier(abilityScore)
  const prof = getProficiencyBonus(character.meta.level)
  const { proficient, expertise } = character.skills[skillId] || {}
  if (expertise) return mod + prof * 2
  if (proficient) return mod + prof
  return mod
}
