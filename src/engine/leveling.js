import { getModifier } from './abilities.js'

// XP required to reach each level (index = level)
const XP_THRESHOLDS = [
  0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000,
  64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
]

export const getLevelFromXP    = (xp) => {
  let level = 1
  for (let i = 2; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i
  }
  return level
}

export const getXPForLevel     = (level) => XP_THRESHOLDS[Math.min(level, 20)] ?? 0
export const getXPForNextLevel = (level) => level >= 20 ? null : XP_THRESHOLDS[level + 1]

export const HIT_DICE = {
  barbarian: 12,
  fighter: 10, paladin: 10, ranger: 10,
  bard: 8, cleric: 8, druid: 8, monk: 8, rogue: 8, warlock: 8,
  sorcerer: 6, wizard: 6,
}

export const getHitDie        = (className) => HIT_DICE[className.toLowerCase()] ?? 8
export const getAverageHPGain = (className) => Math.floor(getHitDie(className) / 2) + 1
export const getMaxHPAtLevel1 = (className, conScore) =>
  getHitDie(className) + getModifier(conScore)
