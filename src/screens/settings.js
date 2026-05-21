import { store } from '../store.js'
import { loadSkin, applyCustomCSS, clearCustomCSS } from '../skin-loader.js'

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
            <label>Class<input id="char-class" type="text" value="${_esc(char.meta.class)}"></label>
            <label>Subclass<input id="char-subclass" type="text" value="${_esc(char.meta.subclass)}"></label>
            <label>Race<input id="char-race" type="text" value="${_esc(char.meta.race)}"></label>
            <label>Background<input id="char-background" type="text" value="${_esc(char.meta.background)}"></label>
            <label>Alignment<input id="char-alignment" type="text" value="${_esc(char.meta.alignment)}"></label>
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
    const val = id => container.querySelector(`#${id}`)?.value ?? ''
    store.updateCharacterPath('meta.name',       val('char-name'))
    store.updateCharacterPath('meta.class',      val('char-class'))
    store.updateCharacterPath('meta.subclass',   val('char-subclass'))
    store.updateCharacterPath('meta.race',       val('char-race'))
    store.updateCharacterPath('meta.background', val('char-background'))
    store.updateCharacterPath('meta.alignment',  val('char-alignment'))
    store.updateCharacterPath('meta.level',   _clamp(parseInt(val('char-level'), 10), 1, 20))
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
