import { store } from '../store.js'
import { data } from '../engine/data/loader.js'

export function render(container) {
  const char = store.getActiveCharacter()
  if (!char) { container.innerHTML = '<p style="padding:1rem">No character.</p>'; return }

  container.innerHTML = `
    <div class="screen screen--feats">

      <div class="panel">
        <div class="settings__section-title">Add Feat</div>
        <input id="feat-search" type="text" placeholder="Search SRD feats…" autocomplete="off">
        <div id="feat-results" style="max-height:200px;overflow-y:auto;margin-top:var(--s-gap-sm)"></div>
        <p style="font-size:var(--s-font-size-xs);color:var(--s-color-text-muted);margin-top:var(--s-gap-sm)">
          The SRD contains only one feat (Alert). Add homebrew feats by name below.
        </p>
        <div style="display:flex;gap:var(--s-gap-sm);margin-top:var(--s-gap-sm)">
          <input id="custom-feat-name" type="text" placeholder="Custom feat name…" style="flex:1">
          <button class="btn btn--accent" id="add-custom-feat">Add</button>
        </div>
      </div>

      <div class="panel" id="feat-list">
        ${char.feats.length === 0
          ? '<p style="color:var(--s-color-text-muted);font-size:var(--s-font-size-sm)">No feats yet.</p>'
          : char.feats.map((f, i) => `
              <div class="feat-card">
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span class="feat-card__name">${f.name}</span>
                  <button class="btn" data-remove="${i}" style="padding:.15rem .4rem;font-size:.7rem">✕</button>
                </div>
                ${f.desc ? `<p class="feat-card__desc">${f.desc}</p>` : ''}
                <div class="divider"></div>
              </div>
            `).join('')
        }
      </div>

    </div>
  `

  attach(container, char)
}

function attach(container, char) {
  const searchEl  = container.querySelector('#feat-search')
  const resultsEl = container.querySelector('#feat-results')

  searchEl.addEventListener('input', () => {
    const q = searchEl.value.trim().toLowerCase()
    if (!q) { resultsEl.innerHTML = ''; return }

    const known   = new Set(char.feats.map(f => f.index).filter(Boolean))
    const matches = data.feats
      .filter(f => f.name.toLowerCase().includes(q) && !known.has(f.index))
      .slice(0, 20)

    if (!matches.length) {
      resultsEl.innerHTML = '<p style="color:var(--s-color-text-muted);font-size:var(--s-font-size-xs);padding:.5rem">No SRD matches</p>'
      return
    }

    resultsEl.innerHTML = matches.map(f => `
      <div class="skill-row" data-add='${JSON.stringify({ index: f.index, name: f.name, desc: f.desc?.[0] ?? '' })}'>
        <span class="skill-row__label">${f.name}</span>
      </div>
    `).join('')

    resultsEl.querySelectorAll('[data-add]').forEach(el => {
      el.addEventListener('click', () => {
        store.updateCharacterPath('feats', [...char.feats, JSON.parse(el.dataset.add)])
        searchEl.value = ''
        resultsEl.innerHTML = ''
        render(container)
      })
    })
  })

  container.querySelector('#add-custom-feat')?.addEventListener('click', () => {
    const name = container.querySelector('#custom-feat-name').value.trim()
    if (!name) return
    store.updateCharacterPath('feats', [...char.feats, { name, desc: '', index: null }])
    container.querySelector('#custom-feat-name').value = ''
    render(container)
  })

  container.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.remove, 10)
      store.updateCharacterPath('feats', char.feats.filter((_, idx) => idx !== i))
      render(container)
    })
  })
}
