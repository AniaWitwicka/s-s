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
    "class": { "name": "Barbarian" },
    "subclass_flavor": "Primal Path",
    "desc": ["Barbarians who follow the Path of the Totem Warrior..."],
    "_source": "phb"
  },
  {
    "index": "storm-herald",
    "name": "Storm Herald",
    "class": { "name": "Barbarian" },
    "subclass_flavor": "Primal Path",
    "desc": ["Storm heralds are barbarians who..."],
    "_source": "phb"
  }
]
```

**2. Open `src/engine/data/loader.js` and add two lines:**

```js
// At the top with the other imports:
import phbSubclasses from './extensions/phb-subclasses.json'

// In the data object:
export const data = {
  subclasses: [...subclassesSRD, ...phbSubclasses],   // ← add here
  // ...rest unchanged
}
```

The Settings screen subclass dropdown will now include your new entries automatically.

---

## Data shapes for each type

Match the shape of the SRD entries. Only include the fields the app actually uses — extras are ignored.

### Subclass

```json
{
  "index":            "totem-warrior",
  "name":             "Totem Warrior",
  "class":            { "name": "Barbarian" },
  "subclass_flavor":  "Primal Path",
  "desc":             ["Description paragraph 1.", "Paragraph 2."],
  "_source":          "phb"
}
```

**Required:** `index`, `name`, `class.name`, `_source`

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
The spellbook search and rules lookup both use these fields.

---

### Feat

```json
{
  "index":         "war-caster",
  "name":          "War Caster",
  "prerequisites": [],
  "desc":          [
    "You have practiced casting spells in the midst of combat...",
    "• You have advantage on Constitution saving throws...",
    "• You can perform the somatic components of spells even when you have weapons or a shield in one or both hands.",
    "• When a hostile creature's movement provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature..."
  ],
  "_source":       "phb"
}
```

**Required:** `index`, `name`, `desc`, `_source`

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

import phbSubclasses  from './extensions/phb-subclasses.json'
import xanatharsSpells from './extensions/xanathars-spells.json'
import homebrewSpells  from './extensions/my-homebrew.json'
import voloRaces       from './extensions/volo-races.json'

export const data = {
  spells:     [...spellsSRD,     ...xanatharsSpells, ...homebrewSpells],
  subclasses: [...subclassesSRD, ...phbSubclasses],
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

## Extracting content from a PDF supplement

1. Open the PDF (or relevant pages) in Claude
2. Paste the relevant schema from above
3. Prompt: *"Extract all [spells / subclasses / feats] from this text. Match this exact JSON shape. Add `_source: 'your-book-name'` to every entry. Flag anything that doesn't fit the schema."*
4. Save the output to `src/engine/data/extensions/your-book-name.json`
5. Add the import and spread to `loader.js`

---

## What the SRD includes (and what it doesn't)

| Content | SRD | Notes |
|---|---|---|
| Classes | ✅ All 12 | |
| Subclasses | ⚠️ 1 per class | Add PHB+ via extensions |
| Spells | ✅ 319 spells | Missing Xanathar's, Tasha's etc. |
| Races | ✅ 9 races | Missing Aasimar, Genasi, etc. |
| Feats | ⚠️ Alert only | Add PHB feats via extensions |
| Equipment | ✅ 237 items | |
| Magic items | ✅ 362 items | |
| Conditions | ✅ All 15 | |
| Backgrounds | ❌ Not in SRD | Hardcoded list in settings.js |
