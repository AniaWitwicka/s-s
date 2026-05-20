# Scroll & Soul — Task List

## Bugs (break existing functionality)

- [ ] **`deepMerge` destroys arrays** — `updateCharacter` uses deepMerge, which treats arrays as objects and merges them by index instead of replacing. Affects every call that patches `spells.known`, `feats`, `inventory.items`, `conditions`, etc. in `Spellbook.jsx` and `Feats.jsx`. Fix: detect arrays in deepMerge and replace rather than merge.
- [ ] **Level Up doesn't update spell slots** — `applyLevelUp` in `leveling.js` handles `hp-roll`, `asi`, `feat` choices but has no branch for `spell-slots`. Spellcasters don't gain new slots when leveling. Fix: add `getAvailableSpellSlots(class, newLevel)` call in the `spell-slots` branch.
- [ ] **`StatBox` `editable`/`onEdit` props are unused** — AC, Speed fields pass `editable` and `onEdit` to StatBox but StatBox ignores them and always renders a static span. AC can't be edited from the UI.
- [ ] **HP on level up resets current to new max** — `applyLevelUp` sets `current: newMax` which heals the character to full on every level up. It should add the roll to current proportionally or just update max.
- [ ] **Parchment skin: text is unreadable** — panels use `--s-color-text-primary` (light cream `#f5e6c8`) by default; parchment skin sets a light background but doesn't flip `--s-color-text-primary` to a dark colour. Only `--s-color-text-panel` is dark. Components need to use `--s-color-text-panel` on light-background panels, or parchment skin must override `--s-color-text-primary`.

---

## Missing core features (app is incomplete without these)

- [ ] **XP editing** — XP value in Overview banner is display-only. Need click-to-edit (same pattern as AbilityOrb). Should also auto-suggest "Level Up available" when XP crosses next threshold.
- [ ] **AC / Speed / Initiative editable** — StatBox needs an edit mode (tap to edit, commit on blur/Enter), same as AbilityOrb. These are the most-changed combat stats mid-session.
- [ ] **Character name & meta editing** — No way to change name, race, class, background, alignment, or deity after creation. Add an Edit screen or inline editing in Overview banner.
- [ ] **Subclass selection** — Displayed in banner but can only be set via Level Up Wizard at subclass levels. Need a way to set/edit it any time (Settings or banner tap).
- [ ] **Portrait upload** — Portrait placeholder exists in Overview but no upload path. Add file input on portrait tap → read as base64 → store in `meta.portrait`.
- [ ] **Conditions tracker** — `character.conditions` array exists in the data model but there is no UI to add/remove conditions or see active ones. Add a compact conditions chip list to Overview (shown when non-empty) or a dedicated section.
- [ ] **Hit Dice display in Overview** — Hit dice remaining (`hp.hitDice.remaining / total`) is only visible inside the Short Rest modal. Show it somewhere on Overview so players know without opening the modal.
- [ ] **Saving throw proficiency defaults by class** — CharacterCreator doesn't set `savingThrowProficiencies` based on chosen class (e.g. Fighter gets STR + CON, Wizard gets INT + WIS). New characters start with no save proficiencies. Populate during creation from a class data lookup.
- [ ] **Class-based skill proficiency selection** — Character creation doesn't let players pick starting skill proficiencies for their class/background. The Skills screen starts with all unproficient.
- [ ] **Inspiration toggle not visible enough** — It's at the bottom of Overview below saving throws and can scroll off. Consider a more prominent home in the header area.

---

## Phase 2 — Inventory & Spellbook polish

- [ ] **SRD item search** — "Add Item" currently only allows manual entry. Integrate `https://www.dnd5eapi.co/api/equipment` to search the SRD item list and auto-fill name/weight/properties.
- [ ] **SRD spell search** — "Add Spell" only allows manual entry. Integrate `https://www.dnd5eapi.co/api/spells?level=X` filtered by class to auto-fill spell data.
- [ ] **Spell selection step in Level Up Wizard** — The wizard has a `spell-slots` step but no spell-picking step. Spellcasters who learn new spells at each level (Wizard, Bard, etc.) need a "choose N spells" step pulling from the SRD.
- [ ] **Item attunement** — `item.attunement` and `item.attuned` exist in the data model but there's no UI for the 3-item attunement limit or attuned toggle.
- [ ] **Currency converter** — No way to convert between coin types (e.g. 10 sp → 1 gp). Low priority but useful.
- [ ] **Equipped weight distinction** — Carry capacity bar counts all items; 5e distinguishes equipped vs. carried in some variant rules. Consider at minimum showing equipped weight separately.

---

## Phase 3 — Rules Lookup & Quality of Life

- [ ] **Rules Lookup drawer** — Spec calls for a bottom-sheet searchable drawer covering spells, feats, conditions, class features, equipment properties. Accessible via `?` icon from any screen. Requires loading SRD data (fetch from API or bundle).
- [ ] **Condition reference** — `CONDITIONS` array exists in `combat.js` but there's no way to look up what "Grappled" or "Stunned" actually does. Should be part of Rules Lookup.
- [ ] **Short Rest: track which hit dice were spent** — Currently `shortRest` store action subtracts 1 die regardless of how many were rolled in the modal. The modal lets you roll multiple times but the store only decrements by 1. Fix the store action to accept dice count.
- [ ] **Long Rest: class ability recovery** — Some classes have abilities that recover on long rest (Channel Divinity, Action Surge, etc.). These aren't tracked; would need a `classAbilities` field.
- [ ] **Death saves auto-reset on healing** — If HP goes above 0, death saves should clear. Currently they only reset on long rest.

---

## Phase 4 — Skins & Export

- [ ] **Skin preview thumbnails** — `skin.json` has a `preview` field but it's empty for all 3 built-in skins and the Settings grid shows coloured rectangles. Add real preview screenshots.
- [ ] **Skin loading feedback** — No loading state while skin fonts/CSS fetch. Brief flash of unstyled content on skin switch.
- [ ] **Custom skin CSS persistence across sessions** — Already implemented via `skinStore` persist, but applying custom CSS on top of a built-in skin only works at runtime; if `customCSS` is loaded before the base skin finishes fetching, variable overrides may not apply. Ensure ordering in `SkinLoader`.
- [ ] **Export to PDF** — Spec Phase 4 item. Generate a printable character sheet. Options: `window.print()` with a print stylesheet, or a library like `jspdf`.
- [ ] **Import/export validation** — `importCharacter` in Settings parses JSON but doesn't validate structure. A malformed import can corrupt the store. Add a basic schema check.

---

## Structural / Architecture

- [ ] **`src/engine/data/` SRD static data** — The spec calls for `classes.json`, `races.json`, `feats.json`, `spells.json`, `skills.json`, `items.json`, `conditions.json` in `src/engine/data/`. Currently nothing is there; all SRD calls would need to hit the API at runtime. Either bundle the data (larger initial load, works offline) or add an async fetch layer with a loading/error state.
- [ ] **TypeScript for skin types** — Spec mentions `src/skins/skinTypes.ts`. Currently everything is plain JS. Not strictly necessary but would catch skin.json shape errors.
- [ ] **`useSkin` hook** — Spec mentions a `useSkin` hook in `src/skins/useSkin.js`. Currently skin logic lives entirely in `SkinLoader.jsx`. Extract the hook for reuse if components need to read current skin variables.
- [ ] **Multiple characters — switcher UX** — Characters are managed in Settings. There's no way to switch characters from any other screen. A character selector in the header or a dedicated screen would be more accessible.
- [ ] **Offline / PWA** — App is local-first but has no service worker. Google Fonts fail without internet and no fallback fonts are loaded. Add a `<link>` preconnect and consider a PWA manifest so it can be installed to home screen.
- [ ] **Mobile viewport** — `App.css` sets `max-width: 480px` but there's no `<meta name="viewport">` tag. Check `index.html` and add viewport meta if missing.
