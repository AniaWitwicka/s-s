import { store } from '../store.js'

export function render(container) {
  const char = store.getActiveCharacter()
  if (!char) { container.innerHTML = '<p style="padding:1rem">No character.</p>'; return }

  container.innerHTML = `
    <div class="screen screen--journal">

      <div style="display:flex;justify-content:flex-end;margin-bottom:var(--s-gap-sm)">
        <button class="btn btn--accent" id="new-entry">+ New Entry</button>
      </div>

      <div class="panel" id="entry-editor" style="display:none;flex-direction:column;gap:var(--s-gap-sm)">
        <input id="entry-title" type="text" placeholder="Title…">
        <textarea id="entry-body" rows="10" placeholder="Write your notes…"></textarea>
        <div style="display:flex;gap:var(--s-gap-sm);justify-content:flex-end">
          <button class="btn" id="cancel-entry">Cancel</button>
          <button class="btn btn--accent" id="save-entry">Save</button>
        </div>
      </div>

      <div id="journal-list">
        ${char.journal.length === 0
          ? '<p style="padding:1rem;color:var(--s-color-text-muted);font-size:var(--s-font-size-sm)">No entries yet.</p>'
          : char.journal.map((e, i) => `
              <div class="panel journal-entry" style="margin-bottom:var(--s-gap-sm)" data-entry="${i}">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:var(--s-gap-sm)">
                  <span class="journal-entry__title">${e.title || 'Untitled'}</span>
                  <button class="btn" data-delete="${i}" style="padding:.15rem .4rem;font-size:.7rem;flex-shrink:0">✕</button>
                </div>
                <p class="journal-entry__preview" style="margin-top:.25rem">${e.body}</p>
                <span style="font-size:var(--s-font-size-xs);color:var(--s-color-text-muted)">${_formatDate(e.createdAt)}</span>
              </div>
            `).join('')
        }
      </div>

    </div>
  `

  attach(container, char)
}

function attach(container, char) {
  let editingIndex = null

  const editor   = container.querySelector('#entry-editor')
  const titleEl  = container.querySelector('#entry-title')
  const bodyEl   = container.querySelector('#entry-body')

  function openEditor(entry = null, idx = null) {
    editingIndex  = idx
    titleEl.value = entry?.title ?? ''
    bodyEl.value  = entry?.body  ?? ''
    editor.style.display = 'flex'
    titleEl.focus()
  }

  container.querySelector('#new-entry').addEventListener('click', () => openEditor())

  container.querySelector('#cancel-entry').addEventListener('click', () => {
    editor.style.display = 'none'
  })

  container.querySelector('#save-entry').addEventListener('click', () => {
    const entry = {
      id:        editingIndex !== null ? char.journal[editingIndex].id : crypto.randomUUID(),
      title:     titleEl.value.trim() || 'Untitled',
      body:      bodyEl.value,
      createdAt: editingIndex !== null ? char.journal[editingIndex].createdAt : new Date().toISOString(),
    }
    const journal = editingIndex !== null
      ? char.journal.map((e, i) => i === editingIndex ? entry : e)
      : [entry, ...char.journal]
    store.updateCharacterPath('journal', journal)
    render(container)
  })

  container.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const i = parseInt(btn.dataset.delete, 10)
      store.updateCharacterPath('journal', char.journal.filter((_, idx) => idx !== i))
      render(container)
    })
  })

  container.querySelectorAll('.journal-entry').forEach(el => {
    el.addEventListener('click', () => {
      const i = parseInt(el.dataset.entry, 10)
      openEditor(char.journal[i], i)
    })
  })
}

function _formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString() } catch { return '' }
}
