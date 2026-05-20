import { getModifier } from './abilities.js'

const XP_THRESHOLDS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000]

export const getLevelFromXP = (xp) => {
  let level = 1
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1
  }
  return Math.min(level, 20)
}

export const getXPForNextLevel = (level) => XP_THRESHOLDS[level] ?? null

export const ASI_LEVELS = [4, 8, 12, 16, 19]

const HIT_DICE = {
  Barbarian: 12, Fighter: 10, Paladin: 10, Ranger: 10,
  Bard: 8, Cleric: 8, Druid: 8, Monk: 8, Rogue: 8, Warlock: 8,
  Sorcerer: 6, Wizard: 6,
}

export const getHitDie = (className) => HIT_DICE[className] || 8

export const getLevelUpSteps = (character) => {
  const { meta } = character
  const newLevel = meta.level + 1
  const hitDie = getHitDie(meta.class)
  const conMod = getModifier(character.abilities.con)
  const steps = []

  steps.push({ type: 'hp-roll', dieType: `d${hitDie}`, conMod, hitDie })

  if (ASI_LEVELS.includes(newLevel)) {
    steps.push({ type: 'asi-or-feat', description: 'Ability Score Improvement or Feat' })
  }

  const SPELLCASTERS = ['Wizard', 'Sorcerer', 'Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Warlock']
  if (SPELLCASTERS.includes(meta.class)) {
    steps.push({ type: 'spell-slots', newLevel })
  }

  const SUBCLASS_LEVELS = {
    Wizard: [2], Sorcerer: [1], Cleric: [1], Druid: [2], Bard: [3],
    Paladin: [3], Ranger: [3], Rogue: [3], Fighter: [3], Barbarian: [3],
    Monk: [3], Warlock: [1],
  }
  const subclassLevels = SUBCLASS_LEVELS[meta.class] || []
  if (subclassLevels.includes(newLevel) && !meta.subclass) {
    steps.push({ type: 'subclass' })
  }

  return steps
}

export const applyLevelUp = (character, choices) => {
  const newLevel = character.meta.level + 1
  let updated = {
    ...character,
    meta: { ...character.meta, level: newLevel },
  }

  for (const choice of choices) {
    if (choice.type === 'hp-roll') {
      const newMax = (updated.hp.max || 0) + choice.value
      updated = {
        ...updated,
        hp: { ...updated.hp, max: newMax, current: newMax },
      }
    }

    if (choice.type === 'asi') {
      updated = {
        ...updated,
        abilities: { ...updated.abilities, ...choice.changes },
      }
    }

    if (choice.type === 'feat') {
      updated = {
        ...updated,
        feats: [...(updated.feats || []), choice.feat],
      }
    }

    if (choice.type === 'subclass') {
      updated = {
        ...updated,
        meta: { ...updated.meta, subclass: choice.subclass },
      }
    }
  }

  return { ...updated, meta: { ...updated.meta, updatedAt: new Date().toISOString() } }
}
