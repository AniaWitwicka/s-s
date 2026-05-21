import { store } from '../store.js'
import { data } from '../engine/data/loader.js'

export function render(container) {
  const char = store.getActiveCharacter()
  if (!char) { container.innerHTML = '<p style="padding:1rem">No character.</p>'; return }

  const equipped   = char.inventory.filter(i => i.equipped)
  const unequipped = char.inventory.filter(i => !i.equipped)

  container.innerHTML = `
    <div class="screen screen--inventory">

      <div class="panel">
        <div class="settings__section-title">Add Item</div>
        <input id="item-search" type="text" placeholder="Search SRD equipment…" autocomplete="off">
        <div id="item-results" style="max-height:200px;overflow-y:auto;margin-top:var(--s-gap-sm)"></div>
      </div>

      ${equipped.length ? `
        <div class="panel">
          <div class="settings__section-title">Equipped</div>
          <div class="inventory__list">${_renderItems(char.inventory, true)}</div>
        </div>
      ` : ''}

      <div class="panel">
        <div class="settings__section-title">Inventory</div>
        <div class="inventory__list">
          ${char.inventory.length === 0
            ? '<p style="color:var(--s-color-text-muted);font-size:var(--s-font-size-sm)">No items yet.</p>'
            : _renderItems(char.inventory, false)}
        </div>
      </div>

    </div>
  `

  attach(container, char)
}

function _renderItems(inventory, equippedOnly) {
  return inventory
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => equippedOnly ? item.equipped : !item.equipped)
    .map(({ item, i }) => {
      // Look up full description from SRD data
      const full = data.equipment.find(e => e.index === item.index)
        ?? data.magicItems.find(e => e.index === item.index)

      const tags = []
      if (full?.equipment_category?.name) tags.push(full.equipment_category.name)
      if (full?.weight)                   tags.push(`${full.weight} lb`)
      if (full?.cost?.quantity)           tags.push(`${full.cost.quantity} ${full.cost.unit}`)

      const desc = full?.desc ?? []

      return `
        <div class="collapse-item">
          <div class="collapse-item__header inventory-item" data-collapse-toggle>
            <input type="checkbox" ${item.equipped ? 'checked' : ''} data-equip="${i}"
                   aria-label="Equipped" style="flex-shrink:0;width:auto">
            <span class="inventory-item__name" style="flex:1">${item.name}</span>
            <span class="collapse-item__chevron">›</span>
            <button class="btn" data-remove="${i}" style="padding:.15rem .4rem;font-size:.7rem;flex-shrink:0">✕</button>
          </div>
          <div class="collapse-item__body">
            ${tags.length ? `
              <div class="collapse-detail">
                ${tags.map(t => `<span class="collapse-detail__tag">${t}</span>`).join('')}
              </div>
            ` : ''}
            ${desc.map(p => `<p class="feat-card__desc" style="margin-bottom:.4rem">${p}</p>`).join('')}
            <div style="display:flex;gap:var(--s-gap-sm);align-items:center;margin-top:var(--s-gap-sm)">
              <label style="margin:0;white-space:nowrap">Qty</label>
              <input type="number" value="${item.quantity}" min="1"
                     data-qty="${i}"
                     style="width:4rem;flex:none">
            </div>
            ${item.notes ? `<p class="feat-card__desc" style="margin-top:var(--s-gap-sm)">${item.notes}</p>` : ''}
          </div>
        </div>
      `
    }).join('')
}

function attach(container, char) {
  // ── Collapse toggle ──
  container.querySelectorAll('[data-collapse-toggle]').forEach(header => {
    header.addEventListener('click', e => {
      if (e.target.closest('[data-equip]')) return   // checkbox — don't collapse
      if (e.target.closest('[data-remove]')) return  // remove button — don't collapse
      header.closest('.collapse-item').classList.toggle('collapse-item--open')
    })
  })

  // ── Search ──
  const searchEl  = container.querySelector('#item-search')
  const resultsEl = container.querySelector('#item-results')

  searchEl.addEventListener('input', () => {
    const q = searchEl.value.trim().toLowerCase()
    if (!q) { resultsEl.innerHTML = ''; return }

    const matches = data.equipment
      .filter(e => e.name.toLowerCase().includes(q))
      .slice(0, 20)

    if (!matches.length) {
      resultsEl.innerHTML = '<p style="color:var(--s-color-text-muted);font-size:var(--s-font-size-xs);padding:.5rem">No matches</p>'
      return
    }

    resultsEl.innerHTML = matches.map(e => `
      <div class="skill-row" data-add='${JSON.stringify({ name: e.name, index: e.index })}'>
        <span class="skill-row__label">${e.name}</span>
        <span class="skill-row__ability">${e.equipment_category?.name ?? ''}</span>
      </div>
    `).join('')

    resultsEl.querySelectorAll('[data-add]').forEach(el => {
      el.addEventListener('click', () => {
        const item = JSON.parse(el.dataset.add)
        store.updateCharacterPath('inventory', [
          ...char.inventory,
          { ...item, quantity: 1, equipped: false, notes: '' },
        ])
        searchEl.value = ''
        resultsEl.innerHTML = ''
        render(container)
      })
    })
  })

  // ── Remove ──
  container.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const i = parseInt(btn.dataset.remove, 10)
      store.updateCharacterPath('inventory', char.inventory.filter((_, idx) => idx !== i))
      render(container)
    })
  })

  // ── Equip toggle ──
  container.querySelectorAll('[data-equip]').forEach(cb => {
    cb.addEventListener('change', () => {
      const i = parseInt(cb.dataset.equip, 10)
      store.updateCharacterPath('inventory',
        char.inventory.map((item, idx) => idx === i ? { ...item, equipped: cb.checked } : item)
      )
      render(container)
    })
  })

  // ── Quantity edit ──
  container.querySelectorAll('[data-qty]').forEach(input => {
    input.addEventListener('change', () => {
      const i   = parseInt(input.dataset.qty, 10)
      const qty = Math.max(1, parseInt(input.value, 10) || 1)
      store.updateCharacterPath('inventory',
        char.inventory.map((item, idx) => idx === i ? { ...item, quantity: qty } : item)
      )
    })
  })
}
