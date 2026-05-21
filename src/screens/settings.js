import { store } from '../store.js'
import { loadSkin, applyCustomCSS, clearCustomCSS } from '../skin-loader.js'
import { data } from '../engine/data/loader.js'

const BACKGROUNDS = [
  'Acolyte','Charlatan','Criminal','Entertainer','Folk Hero',
  'Guild Artisan','Hermit','Noble','Outlander','Sage','Sailor','Soldier','Urchin',
]

const ALIGNMENTS = [
  'Lawful Good','Neutral Good','Chaotic Good',
  'Lawful Neutral','True Neutral','Chaotic Neutral',
  'Lawful Evil','Neutral Evil','Chaotic Evil',
]

function subclassesFor(className) {
  return data.subclasses.filter(sc =>
    sc.class?.name.toLowerCase() === className.toLowerCase()
  )
}

function selectOptions(options, current) {
  return options.map(o => {
    const val   = typeof o === 'string' ? o : o.name
    const label = typeof o === 'string' ? o : o.name
    return `<option value="${val}" ${current === val ? 'selected' : ''}>${label}</option>`
  }).join('')
}

const SKINS = [
  { id: 'default',   name: 'Default'   },
  { id: 'parchment', name: 'Parchment' },
]

export function render(container) {
  const state = store.getState()
  const char  = store.getActiveCharacter()

  container.innerHTML = `
    <div class="screen screen--settings">

      ${char ? `
        <div class="panel">
          <div class="settings__section-title">Character</div>
          <div style="display:flex;flex-direction:column;gap:var(--s-gap-sm)">
            <label>Name<input id="char-name" type="text" value="${_esc(char.meta.name)}"></label>

            <label>Class
              <select id="char-class">
                ${selectOptions(data.classes, char.meta.class)}
              </select>
            </label>

            <label>Subclass
              <select id="char-subclass">
                <option value="">— none —</option>
                ${selectOptions(subclassesFor(char.meta.class), char.meta.subclass)}
              </select>
            </label>

            <label>Race
              <select id="char-race">
                ${selectOptions(data.races, char.meta.race)}
              </select>
            </label>

            <label>Background
              <select id="char-background">
                ${selectOptions(BACKGROUNDS, char.meta.background)}
              </select>
            </label>

            <label>Alignment
              <select id="char-alignment">
                ${selectOptions(ALIGNMENTS, char.meta.alignment)}
              </select>
            </label>

            <label>Level<input id="char-level" type="number" value="${char.meta.level}" min="1" max="20"></label>
            <label>XP<input id="char-xp" type="number" value="${char.meta.xp}" min="0"></label>
            <label>Speed (ft)<input id="char-speed" type="number" value="${char.combat.speed}" min="0" step="5"></label>
            <label>AC<input id="char-ac" type="number" value="${char.combat.ac}" min="1"></label>

            <label>Spellcasting ability
              <select id="char-spell-ability">
                ${['str','dex','con','int','wis','cha'].map(a => `
                  <option value="${a}" ${char.combat.spellcastingAbility === a ? 'selected' : ''}>${a.toUpperCase()}</option>
                `).join('')}
              </select>
            </label>

            <button class="btn btn--accent" id="save-meta">Save</button>
          </div>
        </div>
      ` : ''}

      <div class="panel">
        <div class="settings__section-title">Skin</div>
        <div class="skin-grid">
          ${SKINS.map(s => `
            <div class="skin-card${state.activeSkinId === s.id ? ' skin-card--active' : ''}" data-skin="${s.id}">
              ${s.name}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="panel">
        <div class="settings__section-title">Load skin from GitHub</div>
        <label>
          GitHub path or URL
          <input
            id="gh-skin-input"
            type="text"
            placeholder="e.g. AniaWitwicka/dnd-skin/main/dark-starfield"
            autocomplete="off"
          >
        </label>
        <div style="display:flex;align-items:center;gap:var(--s-gap-sm);margin-top:var(--s-gap-sm)">
          <button class="btn btn--accent" id="gh-skin-load">Load</button>
          <span id="gh-skin-status" style="font-family:var(--s-font-ui);font-size:var(--s-font-size-xs)"></span>
        </div>
      </div>

      <div class="panel">
        <div class="settings__section-title">Custom CSS</div>
        <textarea id="custom-css" rows="10" placeholder="/* paste your skin CSS here */">${_esc(state.customCSS)}</textarea>
        <div style="display:flex;gap:var(--s-gap-sm);margin-top:var(--s-gap-sm)">
          <button class="btn btn--accent" id="apply-css">Apply</button>
          <button class="btn btn--danger" id="clear-css">Clear</button>
        </div>
      </div>

    </div>
  `

  attach(container)
}

function attach(container) {
  container.querySelector('#save-meta')?.addEventListener('click', () => {
    const val  = id => container.querySelector(`#${id}`)?.value ?? ''
    const char = store.getActiveCharacter()

    const newClass    = val('char-class')
    const newSubclass = val('char-subclass')
    const newLevel    = _clamp(parseInt(val('char-level'), 10), 1, 20)

    // If the class or level changed from what meta.classes tracks,
    // reset the class-level breakdown so they stay in sync.
    // (meta.classes is populated by Level Up; settings is the authoritative override.)
    const currentClasses = char?.meta?.classes ?? []
    const trackedTotal   = currentClasses.reduce((s, c) => s + c.level, 0)
    const trackedClass   = currentClasses[0]?.name ?? char?.meta?.class
    const classChanged   = trackedClass !== newClass
    const levelChanged   = trackedTotal !== newLevel

    if (classChanged || levelChanged) {
      // Rebuild as a single-class character at the new level.
      // Multiclass breakdown via Level Up can be rebuilt from there.
      store.updateCharacterPath('meta.classes', [
        { name: newClass, level: newLevel, subclass: newSubclass }
      ])
    }

    store.updateCharacterPath('meta.name',       val('char-name'))
    store.updateCharacterPath('meta.class',      newClass)
    store.updateCharacterPath('meta.subclass',   newSubclass)
    store.updateCharacterPath('meta.race',       val('char-race'))
    store.updateCharacterPath('meta.background', val('char-background'))
    store.updateCharacterPath('meta.alignment',  val('char-alignment'))
    store.updateCharacterPath('meta.level',      newLevel)
    store.updateCharacterPath('meta.xp',      Math.max(0, parseInt(val('char-xp'), 10) || 0))
    store.updateCharacterPath('combat.speed', Math.max(0, parseInt(val('char-speed'), 10) || 30))
    store.updateCharacterPath('combat.ac',    Math.max(1, parseInt(val('char-ac'), 10) || 10))
    store.updateCharacterPath('combat.spellcastingAbility', val('char-spell-ability'))
    render(container)
  })

  container.querySelectorAll('.skin-card').forEach(card => {
    card.addEventListener('click', () => {
      loadSkin(card.dataset.skin)
        .then(() => { store.setActiveSkin(card.dataset.skin); render(container) })
        .catch(err => console.error('Skin load failed:', err))
    })
  })

  // Subclass dropdown updates live when class changes
  container.querySelector('#char-class')?.addEventListener('change', e => {
    const subSel  = container.querySelector('#char-subclass')
    const subs    = subclassesFor(e.target.value)
    subSel.innerHTML = `<option value="">— none —</option>` +
      subs.map(s => `<option value="${s.name}">${s.name}</option>`).join('')
  })

  const ghInput  = container.querySelector('#gh-skin-input')
  const ghStatus = container.querySelector('#gh-skin-status')

  function doGhLoad() {
    const val = ghInput.value.trim()
    if (!val) return

    ghStatus.textContent = 'Loading…'
    ghStatus.style.color = 'var(--s-color-text-muted)'

    const loadBtn = container.querySelector('#gh-skin-load')
    loadBtn.disabled = true

    loadSkin(val)
      .then(() => {
        store.setActiveSkin(val)
        ghStatus.textContent = 'Skin applied!'
        ghStatus.style.color = 'var(--s-color-success)'
        loadBtn.disabled = false
      })
      .catch(() => {
        ghStatus.textContent = 'Could not load skin. Check the path and make sure the repo is public.'
        ghStatus.style.color = 'var(--s-color-danger)'
        loadBtn.disabled = false
      })
  }

  container.querySelector('#gh-skin-load')?.addEventListener('click', doGhLoad)
  ghInput?.addEventListener('keydown', e => { if (e.key === 'Enter') doGhLoad() })

  container.querySelector('#apply-css')?.addEventListener('click', () => {
    const css = container.querySelector('#custom-css').value
    applyCustomCSS(css)
    store.setCustomCSS(css)
  })

  container.querySelector('#clear-css')?.addEventListener('click', () => {
    clearCustomCSS()
    store.setCustomCSS('')
    container.querySelector('#custom-css').value = ''
  })
}

function _esc(str) { return String(str ?? '').replace(/"/g, '&quot;') }
function _clamp(n, min, max) { return isNaN(n) ? min : Math.min(max, Math.max(min, n)) }
