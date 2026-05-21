import { data } from '../engine/data/loader.js'

let drawerEl = null

export function open() {
  if (drawerEl) { drawerEl.querySelector('#rules-search')?.focus(); return }

  drawerEl = document.createElement('div')
  drawerEl.id        = 'rules-drawer'
  drawerEl.className = 'rules-drawer'
  drawerEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--s-gap-sm)">
      <input id="rules-search" type="text" placeholder="Search spells, conditions, rules…" style="flex:1" autocomplete="off">
      <button class="btn" id="close-rules" style="flex-shrink:0">✕ Close</button>
    </div>
    <div id="rules-results" style="margin-top:var(--s-gap-md)"></div>
  `
  document.body.appendChild(drawerEl)
  requestAnimationFrame(() => drawerEl.classList.add('rules-drawer--open'))
  drawerEl.querySelector('#rules-search').focus()

  drawerEl.querySelector('#close-rules').addEventListener('click', closeDrawer)

  const searchEl  = drawerEl.querySelector('#rules-search')
  const resultsEl = drawerEl.querySelector('#rules-results')

  searchEl.addEventListener('input', () => {
    const q = searchEl.value.trim().toLowerCase()
    if (!q) { resultsEl.innerHTML = ''; return }

    const spells     = data.spells.filter(s => s.name.toLowerCase().includes(q)).slice(0, 5)
    const conditions = data.conditions.filter(c => c.name.toLowerCase().includes(q)).slice(0, 3)
    const rules      = data.ruleSections.filter(r => r.name.toLowerCase().includes(q)).slice(0, 2)

    if (!spells.length && !conditions.length && !rules.length) {
      resultsEl.innerHTML = '<p style="color:var(--s-color-text-muted);font-size:var(--s-font-size-xs)">No results</p>'
      return
    }

    const sections = []

    conditions.forEach(c => sections.push(`
      <div class="rules-drawer__section">
        <div class="rules-drawer__title">${c.name}
          <span style="font-size:var(--s-font-size-xs);color:var(--s-color-text-muted)"> (condition)</span>
        </div>
        <div class="rules-drawer__body">${c.desc?.join('<br><br>') ?? ''}</div>
      </div>
    `))

    spells.forEach(s => sections.push(`
      <div class="rules-drawer__section">
        <div class="rules-drawer__title">${s.name}
          <span style="font-size:var(--s-font-size-xs);color:var(--s-color-text-muted)"> · Lvl ${s.level} ${s.school?.name ?? ''}</span>
        </div>
        <div style="font-family:var(--s-font-ui);font-size:var(--s-font-size-xs);color:var(--s-color-text-muted);margin-bottom:.3rem">
          ${[s.casting_time, s.range, s.components?.join(', '), s.duration].filter(Boolean).join(' · ')}
        </div>
        <div class="rules-drawer__body">${s.desc?.[0] ?? ''}</div>
        ${s.higher_level?.[0] ? `<div class="rules-drawer__body" style="margin-top:.5rem"><em>At higher levels:</em> ${s.higher_level[0]}</div>` : ''}
      </div>
    `))

    rules.forEach(r => sections.push(`
      <div class="rules-drawer__section">
        <div class="rules-drawer__title">${r.name}</div>
        <div class="rules-drawer__body">${r.desc ?? ''}</div>
      </div>
    `))

    resultsEl.innerHTML = sections.join('<div class="divider"></div>')
  })
}

function closeDrawer() {
  if (!drawerEl) return
  drawerEl.classList.remove('rules-drawer--open')
  setTimeout(() => {
    drawerEl?.remove()
    drawerEl = null
  }, 260)
}
