import spellsSRD      from './spells.json'
import classesSRD     from './classes.json'
import subclassesSRD  from './subclasses.json'
import racesSRD       from './races.json'
import subracesSRD    from './subraces.json'
import featsSRD       from './feats.json'
import featuresSRD    from './features.json'
import traitsSRD      from './traits.json'
import skillsSRD      from './skills.json'
import equipmentSRD   from './equipment.json'
import magicItemsSRD  from './magic_items.json'
import conditionsSRD  from './conditions.json'
import damageTypesSRD from './damage_types.json'
import rulesSRD       from './rules.json'
import ruleSectionsSRD from './rule_sections.json'

// Extension imports — add new ones here as supplements are extracted
// import phbSubclasses from './extensions/phb-subclasses.json'
// import phbFeatures   from './extensions/phb-features.json'

export const data = {
  spells:       [...spellsSRD],
  classes:      [...classesSRD],
  subclasses:   [...subclassesSRD],
  races:        [...racesSRD],
  subraces:     [...subracesSRD],
  feats:        [...featsSRD],
  features:     [...featuresSRD],
  traits:       [...traitsSRD],
  skills:       [...skillsSRD],
  equipment:    [...equipmentSRD],
  magicItems:   [...magicItemsSRD],
  conditions:   [...conditionsSRD],
  damageTypes:  [...damageTypesSRD],
  rules:        [...rulesSRD],
  ruleSections: [...ruleSectionsSRD],
}

// ── SRD-filtered views ────────────────────────────────────────────────────────
// Use these when you need to serve only open-licensed content publicly.
// _isSRD is set by the fetch script based on the srd/basicRules flag in 5etools.

export const allSpells     = data.spells
export const srdSpells     = data.spells    .filter(s => s._isSRD)

export const allClasses    = data.classes
export const srdClasses    = data.classes   .filter(c => c._isSRD)

export const allSubclasses = data.subclasses
export const srdSubclasses = data.subclasses.filter(s => s._isSRD)

export const allRaces      = data.races
export const srdRaces      = data.races     .filter(r => r._isSRD)

export const allFeats      = data.feats
export const srdFeats      = data.feats     .filter(f => f._isSRD)

export const allFeatures   = data.features
export const srdFeatures   = data.features  .filter(f => f._isSRD)

export const allEquipment  = data.equipment
export const srdEquipment  = data.equipment .filter(e => e._isSRD)

export const allMagicItems = data.magicItems
export const srdMagicItems = data.magicItems.filter(m => m._isSRD)

// ── Single-item lookups ───────────────────────────────────────────────────────

export const getSpell     = (index) => data.spells    .find(s => s.index === index)
export const getFeat      = (index) => data.feats     .find(f => f.index === index)
export const getCondition = (index) => data.conditions.find(c => c.index === index)
export const getClass     = (index) => data.classes   .find(c => c.index === index)
export const getRace      = (index) => data.races     .find(r => r.index === index)
export const getEquipment = (index) => data.equipment .find(e => e.index === index)
export const getMagicItem = (index) => data.magicItems.find(m => m.index === index)
export const getFeature   = (index) => data.features  .find(f => f.index === index)

// ── Search helpers ────────────────────────────────────────────────────────────

/**
 * Search spells with optional filters.
 * filters.srdOnly  — restrict to _isSRD entries (default false)
 * filters.class    — class name string
 * filters.level    — spell level number
 * filters.school   — school name string
 * filters.source   — _source string (exact match)
 *
 * Note: 5etools spells store class associations in classes[] (app schema after
 * transformation) but also in the original classes.fromClassList.
 * The transformed schema uses a flat classes: [{name}] array.
 */
export const searchSpells = (query = '', filters = {}) => {
  const pool = filters.srdOnly ? srdSpells : allSpells
  const q    = query.toLowerCase()
  return pool.filter(spell => {
    if (q && !spell.name.toLowerCase().includes(q)) return false
    if (filters.class) {
      const match = spell.classes?.some(
        c => c.name.toLowerCase() === filters.class.toLowerCase()
      )
      if (!match) return false
    }
    if (filters.level !== undefined && spell.level !== filters.level) return false
    if (filters.school && spell.school?.name?.toLowerCase() !== filters.school.toLowerCase()) return false
    if (filters.source && spell._source !== filters.source) return false
    return true
  })
}

export const searchEquipment = (query = '', filters = {}) => {
  const pool = filters.srdOnly ? srdEquipment : allEquipment
  const q    = query.toLowerCase()
  return pool.filter(item => {
    if (q && !item.name.toLowerCase().includes(q)) return false
    if (filters.category &&
        item.equipment_category?.name?.toLowerCase() !== filters.category.toLowerCase()) return false
    return true
  })
}

export const searchMagicItems = (query = '', filters = {}) => {
  const pool = filters.srdOnly ? srdMagicItems : allMagicItems
  const q    = query.toLowerCase()
  return pool.filter(item => {
    if (q && !item.name.toLowerCase().includes(q)) return false
    if (filters.rarity &&
        item.rarity?.name?.toLowerCase() !== filters.rarity.toLowerCase()) return false
    return true
  })
}

export const getFeaturesForClass = (classIndex, level) =>
  data.features.filter(f =>
    f.class?.index === classIndex && (!level || f.level <= level)
  )
