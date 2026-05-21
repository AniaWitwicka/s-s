import spellsSRD from './spells.json'
import classesSRD from './classes.json'
import subclassesSRD from './subclasses.json'
import racesSRD from './races.json'
import subracesSRD from './subraces.json'
import featsSRD from './feats.json'
import featuresSRD from './features.json'
import traitsSRD from './traits.json'
import skillsSRD from './skills.json'
import equipmentSRD from './equipment.json'
import magicItemsSRD from './magic_items.json'
import conditionsSRD from './conditions.json'
import damageTypesSRD from './damage_types.json'
import rulesSRD from './rules.json'
import ruleSectionsSRD from './rule_sections.json'

// Extension imports — add new ones here as supplements are extracted
// import myExtension from './extensions/my-extension.json'

export const data = {
  spells:        [...spellsSRD],
  classes:       [...classesSRD],
  subclasses:    [...subclassesSRD],
  races:         [...racesSRD],
  subraces:      [...subracesSRD],
  feats:         [...featsSRD],
  features:      [...featuresSRD],
  traits:        [...traitsSRD],
  skills:        [...skillsSRD],
  equipment:     [...equipmentSRD],
  magicItems:    [...magicItemsSRD],
  conditions:    [...conditionsSRD],
  damageTypes:   [...damageTypesSRD],
  rules:         [...rulesSRD],
  ruleSections:  [...ruleSectionsSRD],
}

// Single-item lookups
export const getSpell      = (index) => data.spells.find(s => s.index === index)
export const getFeat       = (index) => data.feats.find(f => f.index === index)
export const getCondition  = (index) => data.conditions.find(c => c.index === index)
export const getClass      = (index) => data.classes.find(c => c.index === index)
export const getRace       = (index) => data.races.find(r => r.index === index)
export const getEquipment  = (index) => data.equipment.find(e => e.index === index)
export const getMagicItem  = (index) => data.magicItems.find(m => m.index === index)
export const getFeature    = (index) => data.features.find(f => f.index === index)

// Search helpers
export const searchSpells = (query, filters = {}) =>
  data.spells.filter(spell => {
    const matchesQuery  = spell.name.toLowerCase().includes(query.toLowerCase())
    const matchesClass  = !filters.class ||
      spell.classes?.some(c => c.name.toLowerCase() === filters.class.toLowerCase())
    const matchesLevel  = filters.level === undefined || spell.level === filters.level
    const matchesSchool = !filters.school ||
      spell.school?.name.toLowerCase() === filters.school.toLowerCase()
    const matchesSource = !filters.source || spell._source === filters.source
    return matchesQuery && matchesClass && matchesLevel && matchesSchool && matchesSource
  })

export const searchEquipment = (query, filters = {}) =>
  data.equipment.filter(item => {
    const matchesQuery    = item.name.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = !filters.category ||
      item.equipment_category?.name.toLowerCase() === filters.category.toLowerCase()
    return matchesQuery && matchesCategory
  })

export const searchMagicItems = (query, filters = {}) =>
  data.magicItems.filter(item => {
    const matchesQuery  = item.name.toLowerCase().includes(query.toLowerCase())
    const matchesRarity = !filters.rarity ||
      item.rarity?.name.toLowerCase() === filters.rarity.toLowerCase()
    return matchesQuery && matchesRarity
  })

export const getFeaturesForClass = (classIndex, level) =>
  data.features.filter(f =>
    f.class?.index === classIndex && (!level || f.level <= level)
  )
