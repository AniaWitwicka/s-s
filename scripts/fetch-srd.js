/**
 * fetch-srd.js  —  Build src/engine/data/ from a local 5etools data directory.
 *
 * LEGAL NOTE:
 *   The 5etools data contains both SRD (free) and non-SRD (copyrighted) content.
 *   Every entry is tagged with _source (book abbreviation) and _isSRD (boolean).
 *   Only serve _isSRD: true content publicly.
 *
 * SETUP:
 *   1. Obtain the 5etools data directory and place it at ./5etools-data/
 *      Expected layout:
 *        5etools-data/data/spells/spells-phb.json   (and spells-xge.json etc.)
 *        5etools-data/data/class/class-barbarian.json  (one file per class)
 *        5etools-data/data/feats.json
 *        5etools-data/data/races.json
 *        5etools-data/data/races-subrace.json
 *        5etools-data/data/backgrounds.json
 *        5etools-data/data/items.json
 *        5etools-data/data/items-base.json
 *        5etools-data/data/magicvariants.json
 *        5etools-data/data/conditionsdiseases.json
 *        5etools-data/data/skills.json
 *        5etools-data/data/rules.json
 *
 *   NOTE: The public 5etools GitHub mirrors were taken down (DMCA, August 2024).
 *         Use a local offline copy. 5etools-data/ is gitignored — never commit it.
 *
 *   2. Run:  node scripts/fetch-srd.js   (or: npm run fetch-data)
 */

import fs   from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(__dirname, '../5etools-data/data')
const OUT = path.resolve(__dirname, '../src/engine/data')

// ── Helpers ───────────────────────────────────────────────────────────────────

function toIndex(name) {
  return String(name)
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function isSRD(entry) {
  return entry.srd === true || entry.basicRules === true
}

/**
 * Recursively flatten 5etools rich-text entries[] into a plain string[].
 * Handles: strings, {type:'list', items:[]}, {type:'entries', entries:[]},
 *          {entry:'...'}, {name:'...', entries:[]} (named blocks).
 * Skips:   tables (too complex to flatten meaningfully).
 */
function flattenEntries(entries) {
  if (!entries) return []
  return entries.flatMap(e => {
    if (typeof e === 'string')       return [e]
    if (!e || typeof e !== 'object') return []
    if (e.type === 'table')          return []
    if (e.entry)                     return [e.entry]
    if (e.entries)                   return flattenEntries(e.entries)
    if (e.items)                     return flattenEntries(e.items)
    return []
  }).filter(s => s && String(s).trim())
}

async function readJSON(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf-8'))
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.warn(`  ⚠  not found: ${path.relative(process.cwd(), filePath)}`)
      return null
    }
    throw e
  }
}

async function writeJSON(filePath, arr) {
  await fs.writeFile(filePath, JSON.stringify(arr, null, 2), 'utf-8')
}

function srdSummary(arr) {
  const srd = arr.filter(e => e._isSRD).length
  return `${arr.length} total (${srd} SRD)`
}

function capitalise(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

// ── Spells ────────────────────────────────────────────────────────────────────

const SCHOOL = {
  A: 'Abjuration', C: 'Conjuration', D: 'Divination', E: 'Enchantment',
  I: 'Illusion',   N: 'Necromancy',  T: 'Transmutation', V: 'Evocation',
}

function formatRange(range) {
  if (!range) return ''
  const d = range.distance ?? {}
  switch (range.type) {
    case 'special':   return 'Special'
    case 'touch':     return 'Touch'
    case 'sight':     return 'Sight'
    case 'unlimited': return 'Unlimited'
    case 'point':
      if (d.type === 'self')  return 'Self'
      if (d.type === 'touch') return 'Touch'
      return `${d.amount ?? ''} ${d.type ?? ''}`.trim()
    case 'radius':
    case 'cone':
    case 'line':
    case 'sphere':
    case 'cube':
    case 'hemisphere':
      return `Self (${d.amount ?? 0}-${d.type ?? 'foot'} ${range.type})`
    default: return ''
  }
}

function formatTime(time) {
  if (!time?.length) return ''
  const t = time[0]
  return t.condition
    ? `${t.number} ${t.unit}, ${t.condition}`
    : `${t.number} ${t.unit}`
}

function formatDuration(duration) {
  if (!duration?.length) return ''
  const d = duration[0]
  if (d.type === 'instant')   return 'Instantaneous'
  if (d.type === 'permanent') return 'Until dispelled'
  if (d.type === 'special')   return 'Special'
  if (d.type === 'timed') {
    const dur = d.duration ?? {}
    return `${dur.amount} ${dur.type}`
  }
  return d.type ?? ''
}

function transformSpell(s) {
  const comp  = s.components ?? {}
  const comps = ['v','s','m','r'].filter(k => comp[k]).map(k => k.toUpperCase())
  const mat   = typeof comp.m === 'string' ? comp.m : (comp.m?.text ?? '')
  const cls   = [
    ...(s.classes?.fromClassList ?? []),
    ...(s.classes?.fromClassListVariant ?? []),
  ].map(c => ({ name: c.name }))

  return {
    index:        toIndex(s.name),
    name:         s.name,
    level:        s.level ?? 0,
    school:       { name: SCHOOL[s.school] ?? s.school },
    casting_time: formatTime(s.time),
    range:        formatRange(s.range),
    components:   comps,
    material:     mat,
    duration:     formatDuration(s.duration),
    concentration: (s.duration ?? []).some(d => d.concentration),
    ritual:       s.meta?.ritual ?? false,
    desc:         flattenEntries(s.entries),
    higher_level: flattenEntries(s.entriesHigherLevel),
    classes:      cls,
    _source:      s.source ?? 'unknown',
    _isSRD:       isSRD(s),
  }
}

async function processSpells() {
  console.log('Processing spells...')
  // Try data/spells/ subdirectory first, fall back to data/ root
  let spellDir = path.join(SRC, 'spells')
  let files = []
  try {
    files = (await fs.readdir(spellDir))
      .filter(f => f.startsWith('spells-') && f.endsWith('.json'))
      .map(f => path.join(spellDir, f))
  } catch {
    spellDir = SRC
    files = ['spells-phb.json', 'spells-xge.json', 'spells-tce.json']
      .map(f => path.join(SRC, f))
  }

  const all = []
  for (const file of files) {
    const raw = await readJSON(file)
    if (!raw) continue
    const spells = (raw.spell ?? []).map(transformSpell)
    const srd = spells.filter(s => s._isSRD).length
    console.log(`  ✓ ${path.basename(file)} — ${spells.length} entries (${srd} SRD)`)
    all.push(...spells)
  }

  await writeJSON(path.join(OUT, 'spells.json'), all)
  console.log(`  → wrote spells.json — ${srdSummary(all)}\n`)
}

// ── Classes / features / subclasses ──────────────────────────────────────────

const FALLBACK_HIT_DIE = {
  barbarian: 12, fighter: 10, paladin: 10, ranger: 10,
  bard: 8, cleric: 8, druid: 8, monk: 8, rogue: 8, warlock: 8,
  sorcerer: 6, wizard: 6,
}

function transformClass(cls) {
  const idx = toIndex(cls.name)
  return {
    index:   idx,
    name:    cls.name,
    hit_die: cls.hd?.faces ?? FALLBACK_HIT_DIE[idx] ?? 8,
    spellcasting: cls.spellcastingAbility ? {
      spellcasting_ability: { name: cls.spellcastingAbility.toUpperCase() }
    } : null,
    proficiency: cls.proficiency ?? [],
    _source: cls.source ?? 'PHB',
    _isSRD:  isSRD(cls),
  }
}

function transformClassFeature(f, classIdx, className) {
  return {
    index:         toIndex(`${classIdx}-${f.name}-${f.level}`),
    name:          f.name,
    class:         { index: classIdx, name: className },
    level:         f.level,
    desc:          flattenEntries(f.entries),
    prerequisites: [],
    _source:       f.source ?? 'PHB',
    _isSRD:        isSRD(f),
  }
}

function transformSubclassFeature(f, classIdx, className, scIdx, scName) {
  return {
    index:         toIndex(`${scIdx}-${f.name}-${f.level}`),
    name:          f.name,
    class:         { index: classIdx, name: className },
    subclass:      { index: scIdx, name: scName },
    level:         f.level,
    desc:          flattenEntries(f.entries),
    prerequisites: [],
    _source:       f.source ?? 'PHB',
    _isSRD:        isSRD(f),
  }
}

function transformSubclass(sc, classIdx, className) {
  // subclass_flavor is the flavour name ("Primal Path", "Arcane Tradition", etc.)
  // 5etools stores it in subclassTableGroups[0].title or not at all
  const flavor = sc.subclassTableGroups?.[0]?.title
    ?? sc.subclassFeatures?.[0]?.match(/\|([^|]+)\|[^|]+\|\d/)?.[1]
    ?? sc.shortName
    ?? ''

  return {
    index:           toIndex(sc.name),
    name:            sc.name,
    class:           { index: classIdx, name: className },
    subclass_flavor: flavor,
    desc:            flattenEntries(sc.entries),
    spells:          [],
    _source:         sc.source ?? 'PHB',
    _isSRD:          isSRD(sc),
  }
}

async function processClasses() {
  console.log('Processing classes...')
  const classDir = path.join(SRC, 'class')
  let files = []
  try {
    files = (await fs.readdir(classDir))
      .filter(f => f.startsWith('class-') && f.endsWith('.json'))
      .map(f => path.join(classDir, f))
  } catch {
    console.warn('  ⚠  class/ directory not found — skipping classes, features, subclasses')
    console.log()
    return
  }

  const allClasses    = []
  const allFeatures   = []
  const allSubclasses = []

  for (const file of files) {
    const raw = await readJSON(file)
    if (!raw) continue

    for (const cls of raw.class ?? []) {
      const className  = cls.name
      const classIdx   = toIndex(className)
      allClasses.push(transformClass(cls))
      console.log(`  ✓ ${path.basename(file)} — ${className}`)

      // Base class features (stored in top-level classFeature array)
      for (const f of raw.classFeature ?? []) {
        if (toIndex(f.className) !== classIdx) continue
        allFeatures.push(transformClassFeature(f, classIdx, className))
      }

      // Subclasses and their features
      for (const sc of cls.subclasses ?? []) {
        const scIdx  = toIndex(sc.name)
        allSubclasses.push(transformSubclass(sc, classIdx, className))

        for (const f of raw.subclassFeature ?? []) {
          if (toIndex(f.className) !== classIdx) continue
          // Match on shortName since feature references use the short form
          if (toIndex(f.subclassShortName ?? '') !== toIndex(sc.shortName ?? sc.name)) continue
          allFeatures.push(transformSubclassFeature(f, classIdx, className, scIdx, sc.name))
        }
      }
    }
  }

  await writeJSON(path.join(OUT, 'classes.json'),    allClasses)
  await writeJSON(path.join(OUT, 'features.json'),   allFeatures)
  await writeJSON(path.join(OUT, 'subclasses.json'), allSubclasses)
  console.log(`  → wrote classes.json    — ${allClasses.length} classes`)
  console.log(`  → wrote features.json   — ${srdSummary(allFeatures)}`)
  console.log(`  → wrote subclasses.json — ${srdSummary(allSubclasses)}\n`)
}

// ── Feats ─────────────────────────────────────────────────────────────────────

async function processFeats() {
  console.log('Processing feats...')
  const raw = await readJSON(path.join(SRC, 'feats.json'))
  if (!raw) { console.log(); return }

  const feats = (raw.feat ?? []).map(f => ({
    index:         toIndex(f.name),
    name:          f.name,
    prerequisites: (f.prerequisite ?? []).map(p => Object.values(p).flat().join(', ')),
    desc:          flattenEntries(f.entries),
    _source:       f.source ?? 'unknown',
    _isSRD:        isSRD(f),
  }))

  await writeJSON(path.join(OUT, 'feats.json'), feats)
  console.log(`  → wrote feats.json — ${srdSummary(feats)}\n`)
}

// ── Races ─────────────────────────────────────────────────────────────────────

function transformRace(r) {
  const ability_bonuses = []
  for (const block of r.ability ?? []) {
    for (const [key, val] of Object.entries(block)) {
      ability_bonuses.push({ ability_score: { name: key.toUpperCase() }, bonus: val })
    }
  }
  const speed = typeof r.speed === 'number' ? r.speed : (r.speed?.walk ?? 30)
  const size  = Array.isArray(r.size)
    ? r.size.map(s => ({ S:'Small',M:'Medium',L:'Large' }[s] ?? s)).join(', ')
    : r.size ?? 'Medium'

  return {
    index:           toIndex(r.name),
    name:            r.name,
    speed,
    ability_bonuses,
    alignment:       '',
    age:             '',
    size,
    languages:       (r.languageProficiencies ?? []).flatMap(p => Object.keys(p).map(l => ({ name: l }))),
    traits:          [],
    _source:         r.source ?? 'unknown',
    _isSRD:          isSRD(r),
  }
}

async function processRaces() {
  console.log('Processing races...')
  const all  = []
  const seen = new Set()
  for (const fname of ['races.json', 'races-subrace.json']) {
    const raw = await readJSON(path.join(SRC, fname))
    if (!raw) continue
    const races = (raw.race ?? []).filter(r => r.name && !seen.has(r.name))
    races.forEach(r => seen.add(r.name))
    const transformed = races.map(transformRace)
    const srd = transformed.filter(r => r._isSRD).length
    console.log(`  ✓ ${fname} — ${transformed.length} entries (${srd} SRD)`)
    all.push(...transformed)
  }
  await writeJSON(path.join(OUT, 'races.json'), all)
  console.log(`  → wrote races.json — ${srdSummary(all)}\n`)
}

// ── Backgrounds ───────────────────────────────────────────────────────────────

async function processBackgrounds() {
  console.log('Processing backgrounds...')
  const raw = await readJSON(path.join(SRC, 'backgrounds.json'))
  if (!raw) { console.log(); return }

  const backgrounds = (raw.background ?? []).map(b => ({
    index:   toIndex(b.name),
    name:    b.name,
    desc:    flattenEntries(b.entries),
    _source: b.source ?? 'unknown',
    _isSRD:  isSRD(b),
  }))

  await writeJSON(path.join(OUT, 'backgrounds.json'), backgrounds)
  console.log(`  → wrote backgrounds.json — ${srdSummary(backgrounds)}\n`)
}

// ── Equipment ─────────────────────────────────────────────────────────────────

const ITEM_CATEGORY = {
  M:'Weapon', R:'Weapon', A:'Ammunition',
  LA:'Armor', MA:'Armor', HA:'Armor', S:'Armor',
  P:'Potion', RD:'Rod', SC:'Scroll', ST:'Staff', W:'Wand', WD:'Wand', RG:'Ring',
  G:'Adventuring Gear', AT:'Artisan\'s Tools', GS:'Gaming Set',
  INS:'Musical Instrument', T:'Tool', VEH:'Vehicle', SHP:'Vehicle', AIR:'Vehicle',
  SCF:'Spellcasting Focus', MNT:'Mount', FD:'Food and Drink', TG:'Trade Good',
}

function isMagicItem(item) {
  return item.wondrous === true || item.staff === true || item.ring === true
    || item.tattoo === true || item.sentient === true
    || (item.rarity && item.rarity !== 'none' && item.rarity !== 'unknown')
}

function transformEquipment(item) {
  return {
    index:              toIndex(item.name),
    name:               item.name,
    equipment_category: { name: ITEM_CATEGORY[item.type] ?? item.type ?? 'Adventuring Gear' },
    cost:               { quantity: Math.round((item.value ?? 0) / 100), unit: 'gp' },
    weight:             item.weight ?? 0,
    desc:               flattenEntries(item.entries),
    _source:            item.source ?? 'unknown',
    _isSRD:             isSRD(item),
  }
}

async function processEquipment() {
  console.log('Processing equipment...')
  const all  = []
  const seen = new Set()

  for (const fname of ['items.json', 'items-base.json']) {
    const raw = await readJSON(path.join(SRC, fname))
    if (!raw) continue
    const items = (raw.item ?? raw.baseitem ?? [])
      .filter(i => i.name && !seen.has(i.name) && !isMagicItem(i))
    items.forEach(i => seen.add(i.name))
    const transformed = items.map(transformEquipment)
    const srd = transformed.filter(i => i._isSRD).length
    console.log(`  ✓ ${fname} — ${transformed.length} entries (${srd} SRD)`)
    all.push(...transformed)
  }

  await writeJSON(path.join(OUT, 'equipment.json'), all)
  console.log(`  → wrote equipment.json — ${srdSummary(all)}\n`)
}

// ── Magic items ───────────────────────────────────────────────────────────────

async function processMagicItems() {
  console.log('Processing magic items...')
  const all  = []
  const seen = new Set()

  // Named magic items are in items.json (wondrous/staff/ring/rarity flags)
  const rawItems = await readJSON(path.join(SRC, 'items.json'))
  if (rawItems) {
    const magic = (rawItems.item ?? []).filter(i => i.name && isMagicItem(i))
    magic.forEach(i => {
      if (seen.has(i.name)) return
      seen.add(i.name)
      all.push({
        index:               toIndex(i.name),
        name:                i.name,
        rarity:              { name: i.rarity ? capitalise(i.rarity) : 'Varies' },
        requires_attunement: !!i.reqAttune,
        desc:                flattenEntries(i.entries),
        _source:             i.source ?? 'unknown',
        _isSRD:              isSRD(i),
      })
    })
    console.log(`  ✓ items.json (magic) — ${magic.length} entries`)
  }

  // Variant/template items in magicvariants.json
  const rawVariants = await readJSON(path.join(SRC, 'magicvariants.json'))
  if (rawVariants) {
    const variants = (rawVariants.variant ?? []).filter(v => v.name && !seen.has(v.name))
    variants.forEach(v => {
      seen.add(v.name)
      all.push({
        index:               toIndex(v.name),
        name:                v.name,
        rarity:              { name: v.rarity ? capitalise(v.rarity) : 'Varies' },
        requires_attunement: !!v.reqAttune,
        desc:                flattenEntries(v.entries),
        _source:             v.source ?? 'unknown',
        _isSRD:              isSRD(v),
      })
    })
    console.log(`  ✓ magicvariants.json — ${variants.length} variants`)
  }

  await writeJSON(path.join(OUT, 'magic_items.json'), all)
  console.log(`  → wrote magic_items.json — ${srdSummary(all)}\n`)
}

// ── Conditions ────────────────────────────────────────────────────────────────

async function processConditions() {
  console.log('Processing conditions...')
  const raw = await readJSON(path.join(SRC, 'conditionsdiseases.json'))
  if (!raw) { console.log(); return }

  const conditions = (raw.condition ?? []).map(c => ({
    index:   toIndex(c.name),
    name:    c.name,
    desc:    flattenEntries(c.entries),
    _source: c.source ?? 'PHB',
    _isSRD:  isSRD(c),
  }))

  await writeJSON(path.join(OUT, 'conditions.json'), conditions)
  console.log(`  → wrote conditions.json — ${srdSummary(conditions)}\n`)
}

// ── Skills ────────────────────────────────────────────────────────────────────

async function processSkills() {
  console.log('Processing skills...')
  const raw = await readJSON(path.join(SRC, 'skills.json'))
  if (!raw) { console.log(); return }

  const skills = (raw.skill ?? []).map(s => ({
    index:         toIndex(s.name),
    name:          s.name,
    ability_score: { name: (s.ability ?? '').toUpperCase() },
    desc:          flattenEntries(s.entries),
    _source:       s.source ?? 'PHB',
    _isSRD:        true,   // all core skills are SRD
  }))

  await writeJSON(path.join(OUT, 'skills.json'), skills)
  console.log(`  → wrote skills.json — ${skills.length} skills\n`)
}

// ── Rules ─────────────────────────────────────────────────────────────────────

async function processRules() {
  console.log('Processing rules...')
  const raw = await readJSON(path.join(SRC, 'rules.json'))
  if (!raw) { console.log(); return }

  const groups = Array.isArray(raw.rules) ? raw.rules : []
  const rules    = []
  const sections = []

  for (const group of groups) {
    if (!group.name) continue
    const gIdx = toIndex(group.name)
    rules.push({
      index:   gIdx,
      name:    group.name,
      desc:    flattenEntries(group.entries ?? []),
      _source: group.source ?? 'SRD',
      _isSRD:  true,
    })
    for (const entry of group.entries ?? []) {
      if (typeof entry !== 'object' || !entry.name || !entry.entries) continue
      sections.push({
        index:   toIndex(entry.name),
        name:    entry.name,
        desc:    flattenEntries(entry.entries),
        rule:    { index: gIdx, name: group.name },
        _source: 'SRD',
        _isSRD:  true,
      })
    }
  }

  await writeJSON(path.join(OUT, 'rules.json'),         rules)
  await writeJSON(path.join(OUT, 'rule_sections.json'), sections)
  console.log(`  → wrote rules.json — ${rules.length} groups`)
  console.log(`  → wrote rule_sections.json — ${sections.length} sections\n`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  try {
    await fs.access(SRC)
  } catch {
    console.error(`
ERROR: 5etools data directory not found at:
  ${SRC}

The public GitHub mirrors were taken down (DMCA, August 2024).
Place your local copy of the 5etools data/ folder there and re-run:
  npm run fetch-data
`)
    process.exit(1)
  }

  console.log(`Source: ${SRC}`)
  console.log(`Output: ${OUT}\n`)

  await processSpells()
  await processClasses()
  await processFeats()
  await processRaces()
  await processBackgrounds()
  await processEquipment()
  await processMagicItems()
  await processConditions()
  await processSkills()
  await processRules()

  console.log('Done.')
}

main().catch(err => { console.error(err); process.exit(1) })
