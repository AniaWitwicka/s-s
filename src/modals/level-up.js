import { store } from '../store.js'
import { getHitDie, getAverageHPGain } from '../engine/leveling.js'
import { getModifier } from '../engine/abilities.js'
import { getSpellSlots, isSpellcaster } from '../engine/spells.js'
import { data } from '../engine/data/loader.js'

function close() {
  document.getElementById('modal-container').innerHTML = ''
}

function rerender() {
  import('../router.js').then(({ navigateTo, getCurrentScreen }) => {
    navigateTo(getCurrentScreen())
  })
}

// Return the classes array, initialising from meta.class + meta.level if empty
function resolveClasses(char) {
  if (Array.isArray(char.meta.classes) && char.meta.classes.length > 0) {
    return char.meta.classes
  }
  return [{ name: char.meta.class || 'Fighter', level: Number(char.meta.level) || 1 }]
}

// Features the character gains for className at classLevel (base class, no subclass)
function featuresGained(className, classLevel) {
  return data.features.filter(f =>
    f.class?.index === className.toLowerCase() &&
    f.level === classLevel &&
    !f.subclass
  )
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

  // Modal state
  let chosenClass = null   // { name, currentLevel }
  let hpGain      = null

  // ── Renderers ────────────────────────────────────────────────────────────

  function renderStep1() {
    const existingBtns = currentClasses.map(cls => `
      <button class="btn levelup__class-btn" data-class="${cls.name}">
        <span class="levelup__class-name">${cls.name}</span>
        <span class="levelup__class-level">Level ${cls.level} → ${cls.level + 1}</span>
      </button>
    `).join('')

    const unusedClasses = data.classes.filter(
      c => !currentClasses.find(cc => cc.name === c.name)
    )
    const newClassSelect = unusedClasses.length ? `
      <div style="display:flex;gap:var(--s-gap-sm);align-items:center;margin-top:var(--s-gap-md)">
        <select id="new-class-select" style="flex:1">
          <option value="">— multiclass into… —</option>
          ${unusedClasses.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
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
        ${newClassSelect}
      </div>
      <div class="modal__footer">
        <button class="btn" id="cancel">Cancel</button>
      </div>
    `
  }

  function renderStep2() {
    const { name, currentLevel } = chosenClass
    const newClassLevel = currentLevel + 1
    const hitDie        = getHitDie(name)
    const avgGain       = getAverageHPGain(name)
    const conMod        = getModifier(Number(char.abilities.con) || 10)
    const conLabel      = conMod >= 0 ? `+${conMod}` : `${conMod}`
    const features      = featuresGained(name, newClassLevel)

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
      </div>

      <div class="modal__footer">
        <button class="btn" id="back">← Back</button>
        <button class="btn btn--accent" id="confirm" disabled>Confirm Level Up</button>
      </div>
    `
  }

  function render() {
    container.innerHTML = `
      <div class="modal-overlay" id="levelup-overlay">
        <div class="modal">
          <button class="modal__close" id="modal-close">×</button>
          <h2 class="modal__title">Level Up</h2>
          ${chosenClass ? renderStep2() : renderStep1()}
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
    container.querySelectorAll('.levelup__class-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cls = currentClasses.find(c => c.name === btn.dataset.class)
        chosenClass = { name: cls.name, currentLevel: cls.level }
        hpGain = null
        render()
      })
    })

    container.querySelector('#add-class-btn')?.addEventListener('click', () => {
      const sel = container.querySelector('#new-class-select')
      if (!sel?.value) return
      chosenClass = { name: sel.value, currentLevel: 0 }
      hpGain = null
      render()
    })

    // ── Step 2 ──
    container.querySelector('#back')?.addEventListener('click', () => {
      chosenClass = null
      hpGain = null
      render()
    })

    if (!chosenClass) return   // nothing below applies on step 1

    const { name } = chosenClass
    const hitDie   = getHitDie(name)
    const avgGain  = getAverageHPGain(name)
    const conMod   = getModifier(Number(char.abilities.con) || 10)
    const confirmBtn = container.querySelector('#confirm')
    const resultEl   = container.querySelector('#hp-result')

    function setGain(gain) {
      hpGain = Math.max(1, gain)
      if (resultEl)   resultEl.textContent = `HP +${hpGain}`
      if (confirmBtn) confirmBtn.disabled  = false
    }

    container.querySelector('#take-avg')?.addEventListener('click', () => setGain(avgGain))
    container.querySelector('#roll-die')?.addEventListener('click', () => {
      setGain(Math.floor(Math.random() * hitDie) + 1 + conMod)
    })

    confirmBtn?.addEventListener('click', () => {
      if (hpGain === null) return

      const { name: cls, currentLevel } = chosenClass
      const newClassLevel = currentLevel + 1

      // ── 1. Update classes array ──
      const updated = [...currentClasses]
      const idx = updated.findIndex(c => c.name === cls)
      if (idx >= 0) {
        updated[idx] = { name: cls, level: newClassLevel }
      } else {
        updated.push({ name: cls, level: newClassLevel })
      }

      const newTotal = updated.reduce((sum, c) => sum + c.level, 0)
      // Primary class = highest level (first wins ties)
      const primary  = updated.reduce((a, b) => b.level > a.level ? b : a)

      // ── 2. Write gained features to char.feats ──
      const gained   = featuresGained(cls, newClassLevel)
      const existing = new Set((char.feats ?? []).map(f => f.index).filter(Boolean))
      const newFeats = gained
        .filter(f => !existing.has(f.index))
        .map(f => ({
          index: f.index,
          name:  f.name,
          desc:  f.desc?.join('\n\n') ?? '',
        }))

      // ── 3. Auto-sync spell slots for the primary (highest-level) class ──
      let newSpellSlots = char.spellSlots
      if (isSpellcaster(primary.name)) {
        const slots = getSpellSlots(primary.name, newTotal)
        if (Array.isArray(slots)) {
          newSpellSlots = { ...char.spellSlots }
          for (let i = 1; i <= 9; i++) {
            newSpellSlots[i] = {
              max:  slots[i] ?? 0,
              used: newSpellSlots[i]?.used ?? 0,
            }
          }
        }
      }

      // ── Commit everything ──
      store.updateCharacterPath('meta.classes',  updated)
      store.updateCharacterPath('meta.level',    newTotal)
      store.updateCharacterPath('meta.class',    primary.name)
      store.updateCharacterPath('hp.max',        char.hp.max + hpGain)
      store.updateCharacterPath('hp.current',    char.hp.current + hpGain)
      store.updateCharacterPath('feats',         [...(char.feats ?? []), ...newFeats])
      store.updateCharacterPath('spellSlots',    newSpellSlots)

      close()
      rerender()
    })
  }

  render()
}
