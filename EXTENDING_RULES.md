# Extending the Rules in Scroll & Soul

The app ships with all content from the **D&D 5e SRD** (System Reference Document) — the free, open-licensed subset of the rules. The SRD is intentionally limited: one subclass per class, one feat (Alert), no racial subraces beyond the basics, etc.

Everything else — Player's Handbook subclasses, Xanathar's Guide spells, homebrew content — can be added through the **extension system** without touching any engine code.

---

## How it works

All SRD data lives in `src/engine/data/*.json`.  
All extension data lives in `src/engine/data/extensions/*.json`.  
Both are merged at startup in `src/engine/data/loader.js`.

Adding an extension is always three steps:

1. Create a JSON file in `src/engine/data/extensions/`
2. Add `"_source": "your-source-name"` to every entry
3. Import it in `loader.js` and spread it into the right array

---

## Step-by-step example — adding PHB subclasses

**1. Create `src/engine/data/extensions/phb-subclasses.json`:**

```json
[
  {
    "index": "totem-warrior",
    "name": "Totem Warrior",
    "class": { "index": "barbarian", "name": "Barbarian" },
    "subclass_flavor": "Primal Path",
    "desc": ["Barbarians who follow the Path of the Totem Warrior..."],
    "_source": "phb"
  }
]
```

**2. Create `src/engine/data/extensions/phb-features.json`** with the features for that subclass (see Features shape below). Without this, the subclass appears in the level-up picker but the Feats tab won't be populated automatically.

**3. Open `src/engine/data/loader.js` and add the imports:**

```js
import phbSubclasses from './extensions/phb-subclasses.json'
import phbFeatures   from './extensions/phb-features.json'

export const data = {
  subclasses: [...subclassesSRD, ...phbSubclasses],
  features:   [...featuresSRD,   ...phbFeatures],
  // ...rest unchanged
}
```

The level-up subclass picker and the Feats tab will both reflect your new content automatically.

---

## Data shapes for each type

Match the shape of the SRD entries. Only include the fields the app actually uses — extras are ignored.

---

### Subclass

```json
{
  "index":           "totem-warrior",
  "name":            "Totem Warrior",
  "class":           { "index": "barbarian", "name": "Barbarian" },
  "subclass_flavor": "Primal Path",
  "desc":            ["Description paragraph 1.", "Paragraph 2."],
  "_source":         "phb"
}
```

**Required:** `index`, `name`, `class.index`, `class.name`, `_source`

> **Note:** `class.index` must be lowercase (e.g. `"barbarian"`, not `"Barbarian"`). The level-up modal matches on `class.index`.

---

### Feature (class or subclass)

Features are what gets written to the **Feats tab** during level-up. Every feature is tied to a class level. Subclass features also reference the subclass.

**Base class feature** (no subclass field):

```json
{
  "index": "totem-warrior-spirit",
  "name":  "Totem Spirit",
  "class": { "index": "barbarian", "name": "Barbarian" },
  "level": 3,
  "desc":  [
    "At 3rd level, when you adopt this path, you choose a totem spirit...",
    "Bear. While raging, you have resistance to all damage except psychic."
  ],
  "prerequisites": [],
  "_source": "phb"
}
```

**Subclass feature** (has a `subclass` field):

```json
{
  "index":    "aspect-of-the-beast",
  "name":     "Aspect of the Beast",
  "class":    { "index": "barbarian", "name": "Barbarian" },
  "subclass": { "index": "totem-warrior", "name": "Totem Warrior" },
  "level":    6,
  "desc":     ["At 6th level, you gain a magical benefit based on the totem animal..."],
  "prerequisites": [],
  "_source":  "phb"
}
```

**Required:** `index`, `name`, `class.index`, `level`, `desc`, `_source`  
**For subclass features:** also `subclass.index` (must match your subclass's `index`)

The app uses `class.index` and `level` to find base features, and `subclass.index` + `level` to find subclass features. Getting these right is what connects the level-up screen to the Feats tab.

---

### Spell

```json
{
  "index":        "void-lance",
  "name":         "Void Lance",
  "level":        3,
  "school":       { "name": "Evocation" },
  "casting_time": "1 action",
  "range":        "120 feet",
  "components":   ["V", "S"],
  "material":     "",
  "duration":     "Instantaneous",
  "concentration":false,
  "ritual":       false,
  "desc":         ["A lance of void energy streaks toward a creature within range..."],
  "higher_level": ["When you cast this spell using a spell slot of 4th level or higher..."],
  "classes":      [{ "name": "Wizard" }, { "name": "Sorcerer" }],
  "_source":      "homebrew"
}
```

**Required:** `index`, `name`, `level`, `school.name`, `classes`, `_source`

---

### Feat

```json
{
  "index":         "war-caster",
  "name":          "War Caster",
  "prerequisites": [],
  "desc":          [
    "You have practiced casting spells in the midst of combat...",
    "• You have advantage on Constitution saving throws that you make to maintain concentration.",
    "• You can perform the somatic components of spells even when you have weapons or a shield in one or both hands.",
    "• When a hostile creature's movement provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature."
  ],
  "_source":       "phb"
}
```

**Required:** `index`, `name`, `desc`, `_source`

> Feats in `data.feats` are what appears in the Feats tab search box. Class/subclass features added via the features array are separate — they get written to `char.feats` automatically during level-up.

---

### Race

```json
{
  "index":        "aasimar",
  "name":         "Aasimar",
  "speed":        30,
  "ability_bonuses": [
    { "ability_score": { "name": "CHA" }, "bonus": 2 }
  ],
  "alignment":    "Often good",
  "age":          "Aasimar mature at the same rate as humans...",
  "size":         "Medium",
  "languages":    [{ "name": "Common" }, { "name": "Celestial" }],
  "traits":       [],
  "_source":      "volo"
}
```

**Required:** `index`, `name`, `_source`

---

### Equipment / item

```json
{
  "index":              "moonblade",
  "name":               "Moonblade",
  "equipment_category": { "name": "Weapon" },
  "cost":               { "quantity": 0, "unit": "gp" },
  "weight":             3,
  "desc":               ["A moonblade is a magical elven sword..."],
  "_source":            "dmg"
}
```

**Required:** `index`, `name`, `equipment_category.name`, `_source`

---

## Wiring multiple extensions in loader.js

```js
// src/engine/data/loader.js

import phbSubclasses   from './extensions/phb-subclasses.json'
import phbFeatures     from './extensions/phb-features.json'
import xanatharsSpells from './extensions/xanathars-spells.json'
import homebrewSpells  from './extensions/my-homebrew.json'
import voloRaces       from './extensions/volo-races.json'

export const data = {
  spells:     [...spellsSRD,     ...xanatharsSpells, ...homebrewSpells],
  subclasses: [...subclassesSRD, ...phbSubclasses],
  features:   [...featuresSRD,   ...phbFeatures],      // ← needed for Feats tab on level-up
  races:      [...racesSRD,      ...voloRaces],
  // everything else stays SRD-only until you add extensions
  feats:      [...featsSRD],
  equipment:  [...equipmentSRD],
  // ...
}
```

---

## The `_source` field

Every entry must have `_source`. It's used to:

- Filter content by book in the rules lookup ("show SRD only")
- Credit content correctly ("from Xanathar's Guide")
- Toggle extensions on/off per campaign in a future update

Use a short consistent string: `"srd"`, `"phb"`, `"xge"`, `"tcoe"`, `"dmg"`, `"volo"`, `"homebrew"`, or your own book abbreviation.

---

## Two hardcoded maps — only relevant for brand new classes

The extension system handles new **subclasses** and **features** with no code changes. However, if you add a **completely new class** (not just subclasses of existing ones), two maps in the engine need updating:

### 1. Subclass selection level — `src/modals/level-up.js`

```js
const SUBCLASS_LEVEL = {
  barbarian: 3, bard: 3, cleric: 1, druid: 2,
  fighter: 3, monk: 3, paladin: 3, ranger: 3,
  rogue: 3, sorcerer: 1, warlock: 1, wizard: 2,
}
```

This tells the level-up flow at which class level the subclass picker appears. Add your new class here:

```js
const SUBCLASS_LEVEL = {
  // ...existing...
  artificer: 3,   // ← your new class
}
```

### 2. Prepared casters — `src/engine/spells.js`

```js
const PREPARED_CASTERS = new Set(['cleric', 'druid', 'paladin', 'wizard'])
const PREP_ABILITY     = { cleric: 'wis', druid: 'wis', paladin: 'cha', wizard: 'int' }
```

If your new class prepares spells from a list (rather than knowing a fixed set), add it here so the spell preparation screen appears after a long rest:

```js
const PREPARED_CASTERS = new Set(['cleric', 'druid', 'paladin', 'wizard', 'artificer'])
const PREP_ABILITY     = { ..., artificer: 'int' }
```

Existing classes (Bard, Sorcerer, Ranger, Warlock) are **known casters** and are intentionally not in this set.

---

## Extracting content from a PDF supplement

1. Open the PDF (or relevant pages) in Claude
2. Paste the relevant schema from above (subclass + features)
3. Prompt: *"Extract all [subclasses / features / spells] from this text. Match this exact JSON shape. Use lowercase for all `index` and `class.index` values. Add `_source: 'your-book-name'` to every entry. Flag anything that doesn't fit the schema."*
4. Save the output to `src/engine/data/extensions/your-book-name.json`
5. Add the import and spread to `loader.js`

---

## What the SRD includes (and what it doesn't)

| Content | SRD | Notes |
|---|---|---|
| Classes | ✅ All 12 | |
| Subclasses | ⚠️ 1 per class | Add PHB+ via extensions |
| Class features | ✅ All SRD levels | Subclass features for PHB paths need extension |
| Spells | ✅ 319 spells | Missing Xanathar's, Tasha's etc. |
| Races | ✅ 9 races | Missing Aasimar, Genasi, etc. |
| Feats | ⚠️ Alert only | Add PHB feats via extensions |
| Equipment | ✅ 237 items | |
| Magic items | ✅ 362 items | |
| Conditions | ✅ All 15 | |
| Backgrounds | ❌ Not in SRD | Hardcoded list in settings.js |
