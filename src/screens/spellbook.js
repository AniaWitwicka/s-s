import { store } from '../store.js'
import { spellSlotTracker } from '../components/spell-slot-tracker.js'
import { data } from '../engine/data/loader.js'
import { isSpellcaster, getSpellSlots } from '../engine/spells.js'
import { open as openRules } from '../modals/rules-lookup.js'

export function render(container) {
  const char = store.getActiveCharacter()
  if (!char) { container.innerHTML = '<p style="padding:1rem">No character.</p>'; return }

  const caster = isSpellcaster(char.meta.class)

  // Group prepared spells by level
  const byLevel = {}
  char.spellbook.forEach(entry => {
    const key = String(entry.level ?? 0)
    if (!byLevel[key]) byLevel[key] = []
    byLevel[key].push(entry)
  })

  container.innerHTML = `
    <div class="screen screen--spellbook">

      ${caster ? `
        <div class="panel">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--s-gap-sm)">
            <div class="settings__section-title" style="margin:0">Spell Slots</div>
            <button class="btn" id="sync-slots" style="font-size:var(--s-font-size-xs);padding:.2rem .5rem">Sync from level</button>
          </div>
          ${spellSlotTracker(char.spellSlots)}
        </div>
      ` : ''}

      <div class="panel">
        <div class="settings__section-title">Add Spell</div>
        <input id="spell-search" type="text" placeholder="Search SRD spells…" autocomplete="off">
        <div id="spell-results" style="max-height:200px;overflow-y:auto;margin-top:var(--s-gap-sm)"></div>
      </div>

      <div class="panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--s-gap-sm)">
          <div class="settings__section-title" style="margin:0">Spellbook</div>
          <button class="btn" id="rules-btn" style="font-size:var(--s-font-size-xs);padding:.2rem .5rem">Look up spell ↑</button>
        </div>
        ${Object.keys(byLevel).length === 0
          ? '<p style="color:var(--s-color-text-muted);font-size:var(--s-font-size-sm)">No spells yet.</p>'
          : Object.entries(byLevel)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([level, spells]) => `
                <div class="spellbook__level-group">
                  <div class="spellbook__level-heading">${level === '0' ? 'Cantrips' : `Level ${level}`}</div>
                  ${spells.map(s => `
                    <div class="spell-row">
                      <span
                        class="spell-row__prepared${s.prepared ? ' spell-row__prepared--yes' : ''}"
                        data-toggle="${s.index}"
                        title="${s.prepared ? 'Prepared' : 'Unprepared'}"
                      ></span>
                      <span class="spell-row__name">${s.name}</span>
                      <span class="spell-row__school">${s.school ?? ''}</span>
                      <button class="btn" data-remove="${s.index}" style="padding:.15rem .4rem;font-size:.7rem">✕</button>
                    </div>
                  `).join('')}
                </div>
              `).join('')
        }
      </div>

    </div>
  `

  attach(container, char)
}

function attach(container, char) {
  container.querySelector('#rules-btn')?.addEventListener('click', openRules)

  // Sync spell slots from class + level
  container.querySelector('#sync-slots')?.addEventListener('click', () => {
    const slots = getSpellSlots(char.meta.class, char.meta.level)
    if (!Array.isArray(slots)) return
    const spellSlots = { ...char.spellSlots }
    for (let i = 1; i <= 9; i++) {
      spellSlots[i] = { max: slots[i] ?? 0, used: spellSlots[i]?.used ?? 0 }
    }
    store.updateCharacterPath('spellSlots', spellSlots)
    render(container)
  })

  // Pip clicks — toggle used
  container.querySelectorAll('.spell-slot-pip').forEach(pip => {
    pip.addEventListener('click', () => {
      const level = pip.dataset.slotLevel
      const index = parseInt(pip.dataset.slotIndex, 10)
      const used  = pip.classList.contains('spell-slot-pip--used') ? index : index + 1
      store.updateCharacterPath(`spellSlots.${level}.used`, Math.min(used, char.spellSlots[level].max))
      render(container)
    })
  })

  // Search
  const searchEl  = container.querySelector('#spell-search')
  const resultsEl = container.querySelector('#spell-results')
  searchEl?.addEventListener('input', () => {
    const q = searchEl.value.trim().toLowerCase()
    if (!q) { resultsEl.innerHTML = ''; return }

    const known = new Set(char.spellbook.map(s => s.index))
    const matches = data.spells
      .filter(s => s.name.toLowerCase().includes(q) && !known.has(s.index))
      .slice(0, 20)

    if (!matches.length) {
      resultsEl.innerHTML = '<p style="color:var(--s-color-text-muted);font-size:var(--s-font-size-xs);padding:.5rem">No matches</p>'
      return
    }

    resultsEl.innerHTML = matches.map(s => `
      <div class="skill-row" data-add='${JSON.stringify({ index: s.index, name: s.name, level: s.level, school: s.school?.name ?? '' })}'>
        <span class="skill-row__label">${s.name}</span>
        <span class="skill-row__ability">Lvl ${s.level} · ${s.school?.name ?? ''}</span>
      </div>
    `).join('')

    resultsEl.querySelectorAll('[data-add]').forEach(el => {
      el.addEventListener('click', () => {
        const spell = JSON.parse(el.dataset.add)
        store.updateCharacterPath('spellbook', [...char.spellbook, { ...spell, prepared: false }])
        searchEl.value = ''
        resultsEl.innerHTML = ''
        render(container)
      })
    })
  })

  // Toggle prepared
  container.querySelectorAll('[data-toggle]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation()
      const idx = el.dataset.toggle
      store.updateCharacterPath('spellbook',
        char.spellbook.map(s => s.index === idx ? { ...s, prepared: !s.prepared } : s)
      )
      render(container)
    })
  })

  // Remove spell
  container.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const idx = btn.dataset.remove
      store.updateCharacterPath('spellbook', char.spellbook.filter(s => s.index !== idx))
      render(container)
    })
  })
}
