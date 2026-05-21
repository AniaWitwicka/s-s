import { store } from '../store.js'
import { getSpellSlots, isSpellcaster, isPactMagic, isPreparedCaster, getMaxPrepared, getPrepAbility } from '../engine/spells.js'

function close() {
  document.getElementById('modal-container').innerHTML = ''
}
function rerender() {
  import('../router.js').then(({ navigateTo, getCurrentScreen }) => {
    navigateTo(getCurrentScreen())
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Resolve classes array from char (same pattern as level-up)
function resolveClasses(char) {
  if (Array.isArray(char.meta.classes) && char.meta.classes.length > 0) {
    return char.meta.classes
  }
  return [{ name: char.meta.class || 'Fighter', level: Number(char.meta.level) || 1 }]
}

// Total max prepared spells across all prepared-caster classes the character has
function calcMaxPrepared(char) {
  const classes = resolveClasses(char)
  let total = 0
  for (const cls of classes) {
    if (!isPreparedCaster(cls.name)) continue
    const abilityKey   = getPrepAbility(cls.name)
    const abilityScore = Number(char.abilities[abilityKey]) || 10
    total += getMaxPrepared(cls.name, cls.level, abilityScore)
  }
  return Math.max(1, total)
}

// Does the character have any prepared-caster class?
function hasPreparedCaster(char) {
  return resolveClasses(char).some(c => isPreparedCaster(c.name))
}

// Reset all spell slots to full (used → 0) for non-pact casters
function resetSlots(char) {
  const classes = resolveClasses(char)
  const updated = { ...char.spellSlots }

  for (const cls of classes) {
    if (!isSpellcaster(cls.name) || isPactMagic(cls.name)) continue
    const slots = getSpellSlots(cls.name, cls.level)
    if (!Array.isArray(slots)) continue
    for (let i = 1; i <= 9; i++) {
      updated[i] = { max: slots[i] ?? updated[i]?.max ?? 0, used: 0 }
    }
  }
  return updated
}

// Reset Warlock pact slots (all used → 0) — triggers on both short and long rest
function resetPactSlots(char) {
  const updated = { ...char.spellSlots }
  for (let i = 1; i <= 9; i++) {
    if ((updated[i]?.max ?? 0) > 0) {
      updated[i] = { ...updated[i], used: 0 }
    }
  }
  return updated
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function open() {
  const container = document.getElementById('modal-container')
  let preparedSpells = null   // null = haven't entered prep screen yet

  function render() {
    container.innerHTML = preparedSpells === null
      ? renderRestPicker()
      : renderSpellPrep()
    attachEvents()
  }

  // ── Step 1: short / long rest choice ─────────────────────────────────────
  function renderRestPicker() {
    return `
      <div class="modal-overlay" id="rest-overlay">
        <div class="modal">
          <button class="modal__close" id="modal-close">×</button>
          <h2 class="modal__title">Take a Rest</h2>
          <div class="modal__body rest-options">

            <div class="rest-option">
              <span class="rest-option__title">Short Rest</span>
              <p class="rest-option__desc">
                Spend Hit Dice to recover HP. Abilities that recharge on a short rest are restored.
                Warlocks regain all pact magic slots.
              </p>
              <button class="btn" id="short-rest">Short Rest</button>
            </div>

            <div class="divider"></div>

            <div class="rest-option">
              <span class="rest-option__title">Long Rest</span>
              <p class="rest-option__desc">
                Regain all HP, reset death saves, and restore all spell slots.
                Prepared casters may swap their spells.
              </p>
              <button class="btn btn--accent" id="long-rest">Long Rest</button>
            </div>

          </div>
        </div>
      </div>
    `
  }

  // ── Step 2: spell preparation (prepared casters after long rest) ──────────
  function renderSpellPrep() {
    const char      = store.getActiveCharacter()
    const maxPrep   = calcMaxPrepared(char)
    const curCount  = preparedSpells.filter(s => s.prepared).length
    const atMax     = curCount >= maxPrep

    // Group by spell level
    const byLevel = {}
    preparedSpells.forEach(s => {
      const key = String(s.level ?? 0)
      if (!byLevel[key]) byLevel[key] = []
      byLevel[key].push(s)
    })

    const counterColor = atMax ? 'var(--s-color-danger)' : 'var(--s-color-accent)'

    const spellRows = Object.entries(byLevel)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, spells]) => `
        <div class="spellbook__level-group" style="margin-bottom:var(--s-gap-sm)">
          <div class="spellbook__level-heading">${level === '0' ? 'Cantrips' : `Level ${level}`}</div>
          ${spells.map(s => `
            <div class="spell-row" data-toggle-prep="${s.index}"
                 style="cursor:pointer;opacity:${!s.prepared && atMax ? '0.4' : '1'}">
              <span class="spell-row__prepared${s.prepared ? ' spell-row__prepared--yes' : ''}"
                    title="${s.prepared ? 'Prepared' : 'Unprepared'}"></span>
              <span class="spell-row__name">${s.name}</span>
              <span class="spell-row__school">${s.school ?? ''}</span>
            </div>
          `).join('')}
        </div>
      `).join('')

    return `
      <div class="modal-overlay" id="rest-overlay">
        <div class="modal">
          <button class="modal__close" id="modal-close">×</button>
          <h2 class="modal__title">Prepare Spells</h2>
          <div class="modal__body">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--s-gap-md)">
              <p style="font-family:var(--s-font-ui);font-size:var(--s-font-size-xs);color:var(--s-color-text-muted)">
                Choose which spells to have prepared.<br>Cantrips are always prepared.
              </p>
              <span style="font-family:var(--s-font-display);font-size:var(--s-font-size-lg);color:${counterColor};white-space:nowrap;padding-left:var(--s-gap-md)">
                ${curCount} / ${maxPrep}
              </span>
            </div>
            <div style="max-height:320px;overflow-y:auto">
              ${spellRows || '<p style="color:var(--s-color-text-muted);font-size:var(--s-font-size-sm)">No spells in spellbook yet.</p>'}
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--accent" id="done-prep">Done</button>
          </div>
        </div>
      </div>
    `
  }

  // ── Events ────────────────────────────────────────────────────────────────
  function attachEvents() {
    const overlay = container.querySelector('#rest-overlay')
    const doClose = () => close()
    container.querySelector('#modal-close')?.addEventListener('click', doClose)
    overlay?.addEventListener('click', e => { if (e.target === overlay) doClose() })

    // Step 1 buttons
    container.querySelector('#short-rest')?.addEventListener('click', () => {
      const char = store.getActiveCharacter()
      if (!char) { close(); return }

      // Warlocks regain pact slots on short rest
      const classes = resolveClasses(char)
      const hasWarlock = classes.some(c => isPactMagic(c.name))
      if (hasWarlock) {
        store.updateCharacterPath('spellSlots', resetPactSlots(char))
      }

      close()
      rerender()
    })

    container.querySelector('#long-rest')?.addEventListener('click', () => {
      const char = store.getActiveCharacter()
      if (!char) { close(); return }

      // Restore HP, death saves, all slots
      store.updateCharacterPath('hp.current',  char.hp.max)
      store.updateCharacterPath('hp.temp',     0)
      store.updateCharacterPath('deathSaves',  { successes: 0, failures: 0 })
      store.updateCharacterPath('spellSlots',  {
        ...resetSlots(char),
        ...resetPactSlots(char),
      })

      // If any class is a prepared caster and they have spells → prep screen
      const freshChar = store.getActiveCharacter()
      if (hasPreparedCaster(freshChar) && freshChar.spellbook.length > 0) {
        // Cantrips (level 0) are always prepared; non-cantrips carry their current state
        preparedSpells = freshChar.spellbook.map(s => ({
          ...s,
          prepared: s.level === 0 ? true : (s.prepared ?? false),
        }))
        render()
      } else {
        close()
        rerender()
      }
    })

    // Step 2: toggle spell prepared state
    container.querySelectorAll('[data-toggle-prep]').forEach(row => {
      row.addEventListener('click', () => {
        const char    = store.getActiveCharacter()
        const maxPrep = calcMaxPrepared(char)
        const idx     = preparedSpells.findIndex(s => s.index === row.dataset.togglePrep)
        if (idx === -1) return

        const spell = preparedSpells[idx]
        if (spell.level === 0) return   // cantrips always prepared

        const curCount = preparedSpells.filter(s => s.prepared).length
        if (!spell.prepared && curCount >= maxPrep) return   // at cap, can't prepare more

        preparedSpells = preparedSpells.map((s, i) =>
          i === idx ? { ...s, prepared: !s.prepared } : s
        )
        render()
      })
    })

    // Step 2: done — save prepared state
    container.querySelector('#done-prep')?.addEventListener('click', () => {
      store.updateCharacterPath('spellbook', preparedSpells)
      close()
      rerender()
    })
  }

  render()
}
