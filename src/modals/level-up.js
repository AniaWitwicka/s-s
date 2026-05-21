import { store } from '../store.js'
import { getHitDie, getAverageHPGain } from '../engine/leveling.js'
import { getModifier } from '../engine/abilities.js'
import { getSpellSlots, isSpellcaster } from '../engine/spells.js'
import { data } from '../engine/data/loader.js'

// Level at which each class picks its subclass
const SUBCLASS_LEVEL = {
  barbarian: 3, bard: 3, cleric: 1, druid: 2,
  fighter: 3, monk: 3, paladin: 3, ranger: 3,
  rogue: 3, sorcerer: 1, warlock: 1, wizard: 2,
}

function close() {
  document.getElementById('modal-container').innerHTML = ''
}
function rerender() {
  import('../router.js').then(({ navigateTo, getCurrentScreen }) => {
    navigateTo(getCurrentScreen())
  })
}

// Ensure every entry in the classes array has a subclass field
function resolveClasses(char) {
  if (Array.isArray(char.meta.classes) && char.meta.classes.length > 0) {
    return char.meta.classes.map(c => ({ subclass: '', ...c }))
  }
  return [{
    name:     char.meta.class    || 'Fighter',
    level:    Number(char.meta.level) || 1,
    subclass: char.meta.subclass || '',
  }]
}

// Base class features gained at a specific class level (no subclass features)
function baseFeatures(className, classLevel) {
  return data.features.filter(f =>
    f.class?.index === className.toLowerCase() &&
    f.level === classLevel &&
    !f.subclass
  )
}

// Subclass features gained at a specific class level
function subclassFeatures(subclassIndex, classLevel) {
  return data.features.filter(f =>
    f.subclass?.index === subclassIndex &&
    f.level === classLevel
  )
}

// Convert a features array to feat objects ready for char.feats
function toFeatEntries(features) {
  return features.map(f => ({
    index: f.index,
    name:  f.name,
    desc:  Array.isArray(f.desc) ? f.desc.join('\n\n') : (f.desc ?? ''),
  }))
}

export function open() {
  const char = store.getActiveCharacter()
  if (!char) return

  const totalLevel = Number(char.meta.level) || 1
  if (totalLevel >= 20) {
    alert('Already at maximum level (20)!')
    return
  }

  const currentClasses = resolveClasses(char)
  const container      = document.getElementById('modal-container')

  // ── Modal state ───────────────────────────────────────────────────────────
  let step           = 1      // 1 | 2 | 3
  let chosenClass    = null   // { name, currentLevel, subclass }
  let chosenSubclass = null   // subclass object from data.subclasses
  let hpGain         = null

  // Does this level-up require picking a subclass?
  function needsSubclass() {
    if (!chosenClass) return false
    const cls      = chosenClass.name.toLowerCase()
    const newLevel = chosenClass.currentLevel + 1
    return SUBCLASS_LEVEL[cls] === newLevel && !chosenClass.subclass
  }

  // ── Step 1: pick which class gains a level ────────────────────────────────
  function renderStep1() {
    const existingBtns = currentClasses.map(cls => `
      <button class="btn levelup__class-btn" data-class="${cls.name}">
        <span class="levelup__class-name">${cls.name}</span>
        <span class="levelup__class-level">Level ${cls.level} → ${cls.level + 1}${cls.subclass ? ' · ' + cls.subclass : ''}</span>
      </button>
    `).join('')

    const unused = data.classes.filter(c => !currentClasses.find(cc => cc.name === c.name))
    const multiSelect = unused.length ? `
      <div style="display:flex;gap:var(--s-gap-sm);align-items:center;margin-top:var(--s-gap-md)">
        <select id="new-class-select" style="flex:1">
          <option value="">— multiclass into… —</option>
          ${unused.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
        </select>
        <button class="btn btn--accent" id="add-class-btn">Add</button>
      </div>
    ` : ''

    return `
      <div class="modal__body">
        <p class="levelup__section-label">Which class gains a level?</p>
        <div style="display:flex;flex-direction:column;gap:var(--s-gap-sm)">
          ${existingBtns}
        </div>
        ${multiSelect}
      </div>
      <div class="modal__footer">
        <button class="btn" id="cancel">Cancel</button>
      </div>
    `
  }

  // ── Step 2: roll HP, preview base features ────────────────────────────────
  function renderStep2() {
    const { name, currentLevel } = chosenClass
    const newClassLevel = currentLevel + 1
    const hitDie        = getHitDie(name)
    const avgGain       = getAverageHPGain(name)
    const conMod        = getModifier(Number(char.abilities.con) || 10)
    const conLabel      = conMod >= 0 ? `+${conMod}` : `${conMod}`
    const features      = baseFeatures(name, newClassLevel)
    const goToSubclass  = needsSubclass()

    // Subclass teaser if they're about to pick one
    const subclassFlavour = data.subclasses.find(
      s => s.class?.name?.toLowerCase() === name.toLowerCase()
    )?.subclass_flavor ?? 'Subclass'

    const subclassTeaser = goToSubclass ? `
      <div class="rest-option" style="margin-top:var(--s-gap-md);border-color:var(--s-color-accent)">
        <span class="rest-option__title">Choose your ${subclassFlavour}</span>
        <p class="rest-option__desc">Next you'll pick a path — your choice unlocks unique features and spells.</p>
      </div>
    ` : ''

    const featuresHtml = features.length ? `
      <div style="margin-top:var(--s-gap-md)">
        <p class="levelup__section-label">Features gained</p>
        ${features.map(f => `
          <div class="rest-option" style="margin-bottom:var(--s-gap-sm)">
            <span class="rest-option__title">${f.name}</span>
            <p class="rest-option__desc">${f.desc[0] ?? ''}</p>
          </div>
        `).join('')}
      </div>
    ` : ''

    const confirmLabel = goToSubclass ? 'Choose Path →' : 'Confirm Level Up'

    return `
      <div class="modal__body">
        <p style="text-align:center;font-family:var(--s-font-ui);color:var(--s-color-accent);margin-bottom:var(--s-gap-md)">
          ${name} — Level ${newClassLevel}
        </p>

        <div class="rest-option">
          <span class="rest-option__title">HP Increase (d${hitDie} ${conLabel} CON)</span>
          <p class="rest-option__desc">Take the average or roll.</p>
          <div style="display:flex;gap:var(--s-gap-sm);margin-top:var(--s-gap-sm)">
            <button class="btn" id="take-avg">+${avgGain} (average)</button>
            <button class="btn" id="roll-die">Roll d${hitDie}</button>
          </div>
          <p id="hp-result" style="font-family:var(--s-font-ui);color:var(--s-color-accent);margin-top:var(--s-gap-sm);min-height:1.4em"></p>
        </div>

        ${featuresHtml}
        ${subclassTeaser}
      </div>

      <div class="modal__footer">
        <button class="btn" id="back">← Back</button>
        <button class="btn btn--accent" id="step2-next" disabled>${confirmLabel}</button>
      </div>
    `
  }

  // ── Step 3: pick subclass ─────────────────────────────────────────────────
  function renderStep3() {
    const { name, currentLevel } = chosenClass
    const newClassLevel = currentLevel + 1

    const classSubclasses = data.subclasses.filter(
      s => s.class?.name?.toLowerCase() === name.toLowerCase()
    )
    const subclassFlavour = classSubclasses[0]?.subclass_flavor ?? 'Subclass'

    // Preview features for the currently highlighted subclass
    const previewFeats = chosenSubclass
      ? subclassFeatures(chosenSubclass.index, newClassLevel)
      : []

    const previewHtml = previewFeats.length ? `
      <div style="margin-top:var(--s-gap-md)">
        <p class="levelup__section-label">Features from ${chosenSubclass.name}</p>
        ${previewFeats.map(f => `
          <div class="rest-option" style="margin-bottom:var(--s-gap-sm)">
            <span class="rest-option__title">${f.name}</span>
            <p class="rest-option__desc">${f.desc[0] ?? ''}</p>
          </div>
        `).join('')}
      </div>
    ` : (chosenSubclass ? '<p style="font-family:var(--s-font-ui);font-size:var(--s-font-size-xs);color:var(--s-color-text-muted);margin-top:var(--s-gap-md)">No features at this level — more unlock as you advance.</p>' : '')

    return `
      <div class="modal__body">
        <p class="levelup__section-label">Choose your ${subclassFlavour}</p>

        <div style="display:flex;flex-direction:column;gap:var(--s-gap-sm)">
          ${classSubclasses.map(s => `
            <button class="btn levelup__class-btn levelup__subclass-btn ${chosenSubclass?.index === s.index ? 'levelup__subclass-btn--active' : ''}"
                    data-subclass="${s.index}">
              <span class="levelup__class-name">${s.name}</span>
              <span class="levelup__class-level">${s.subclass_flavor ?? ''}</span>
            </button>
          `).join('')}
        </div>

        ${previewHtml}
      </div>

      <div class="modal__footer">
        <button class="btn" id="back">← Back</button>
        <button class="btn btn--accent" id="confirm" ${chosenSubclass ? '' : 'disabled'}>Confirm Level Up</button>
      </div>
    `
  }

  // ── Main render ───────────────────────────────────────────────────────────
  function render() {
    container.innerHTML = `
      <div class="modal-overlay" id="levelup-overlay">
        <div class="modal">
          <button class="modal__close" id="modal-close">×</button>
          <h2 class="modal__title">Level Up</h2>
          ${step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderStep3()}
        </div>
      </div>
    `
    attachEvents()
  }

  // ── Event wiring ─────────────────────────────────────────────────────────
  function attachEvents() {
    const overlay = container.querySelector('#levelup-overlay')
    const doClose = () => close()
    container.querySelector('#modal-close')?.addEventListener('click', doClose)
    container.querySelector('#cancel')?.addEventListener('click', doClose)
    overlay?.addEventListener('click', e => { if (e.target === overlay) doClose() })

    // ── Step 1 ──
    if (step === 1) {
      container.querySelectorAll('.levelup__class-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const cls = currentClasses.find(c => c.name === btn.dataset.class)
          chosenClass = { name: cls.name, currentLevel: cls.level, subclass: cls.subclass }
          hpGain = null
          step = 2
          render()
        })
      })
      container.querySelector('#add-class-btn')?.addEventListener('click', () => {
        const sel = container.querySelector('#new-class-select')
        if (!sel?.value) return
        chosenClass = { name: sel.value, currentLevel: 0, subclass: '' }
        hpGain = null
        step = 2
        render()
      })
      return
    }

    // ── Step 2 ──
    if (step === 2) {
      container.querySelector('#back')?.addEventListener('click', () => {
        step = 1; chosenClass = null; hpGain = null; render()
      })

      const { name } = chosenClass
      const hitDie  = getHitDie(name)
      const avgGain = getAverageHPGain(name)
      const conMod  = getModifier(Number(char.abilities.con) || 10)
      const nextBtn = container.querySelector('#step2-next')
      const resultEl = container.querySelector('#hp-result')

      function setGain(gain) {
        hpGain = Math.max(1, gain)
        if (resultEl) resultEl.textContent = `HP +${hpGain}`
        if (nextBtn)  nextBtn.disabled = false
      }

      container.querySelector('#take-avg')?.addEventListener('click', () => setGain(avgGain))
      container.querySelector('#roll-die')?.addEventListener('click', () => {
        setGain(Math.floor(Math.random() * hitDie) + 1 + conMod)
      })

      nextBtn?.addEventListener('click', () => {
        if (hpGain === null) return
        if (needsSubclass()) {
          step = 3; render()
        } else {
          doConfirm()
        }
      })
      return
    }

    // ── Step 3 ──
    if (step === 3) {
      container.querySelector('#back')?.addEventListener('click', () => {
        step = 2; chosenSubclass = null; render()
      })

      container.querySelectorAll('.levelup__subclass-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          chosenSubclass = data.subclasses.find(s => s.index === btn.dataset.subclass) ?? null
          render()  // re-render step 3 with preview updated
        })
      })

      container.querySelector('#confirm')?.addEventListener('click', () => {
        if (chosenSubclass) doConfirm()
      })
    }
  }

  // ── Commit everything to the store ────────────────────────────────────────
  function doConfirm() {
    const { name: cls, currentLevel } = chosenClass
    const newClassLevel = currentLevel + 1

    // 1. Update classes array
    const updated = [...currentClasses]
    const idx = updated.findIndex(c => c.name === cls)
    const subclassName = chosenSubclass?.name ?? chosenClass.subclass ?? ''
    if (idx >= 0) {
      updated[idx] = { name: cls, level: newClassLevel, subclass: subclassName }
    } else {
      updated.push({ name: cls, level: newClassLevel, subclass: subclassName })
    }

    const newTotal = updated.reduce((sum, c) => sum + c.level, 0)
    const primary  = updated.reduce((a, b) => b.level > a.level ? b : a)

    // 2. Collect features → feats (base + subclass if chosen)
    const gained = [
      ...baseFeatures(cls, newClassLevel),
      ...(chosenSubclass ? subclassFeatures(chosenSubclass.index, newClassLevel) : []),
    ]
    const existingIndexes = new Set((char.feats ?? []).map(f => f.index).filter(Boolean))
    const newFeatEntries  = toFeatEntries(gained.filter(f => !existingIndexes.has(f.index)))

    // 3. Auto-sync spell slots for primary spellcasting class
    let newSpellSlots = char.spellSlots
    if (isSpellcaster(primary.name)) {
      const slots = getSpellSlots(primary.name, newTotal)
      if (Array.isArray(slots)) {
        newSpellSlots = { ...char.spellSlots }
        for (let i = 1; i <= 9; i++) {
          newSpellSlots[i] = { max: slots[i] ?? 0, used: newSpellSlots[i]?.used ?? 0 }
        }
      }
    }

    // 4. Commit
    store.updateCharacterPath('meta.classes',  updated)
    store.updateCharacterPath('meta.level',    newTotal)
    store.updateCharacterPath('meta.class',    primary.name)
    store.updateCharacterPath('meta.subclass', primary.subclass ?? subclassName)
    store.updateCharacterPath('hp.max',        char.hp.max + hpGain)
    store.updateCharacterPath('hp.current',    char.hp.current + hpGain)
    store.updateCharacterPath('feats',         [...(char.feats ?? []), ...newFeatEntries])
    store.updateCharacterPath('spellSlots',    newSpellSlots)

    close()
    rerender()
  }

  render()
}
