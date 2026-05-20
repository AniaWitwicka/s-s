import { useState, useEffect, useRef, useCallback } from 'react'
import { useCharacterStore, useActiveCharacter } from '../store/characterStore.js'
import { useSkinStore } from '../store/skinStore.js'
import './Settings.css'

const BUILT_IN_SKINS = ['default', 'parchment', 'minimal']
const SKIN_LABELS = { default: 'Arcane Tome', parchment: 'Parchment', minimal: 'Minimal' }
const SKIN_DESCS = {
  default: 'Dark starfield with gold',
  parchment: 'Warm ink on aged parchment',
  minimal: 'Clean light system fonts',
}

function useDebounce(fn, delay) {
  const timer = useRef(null)
  return useCallback((...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

export default function Settings({ onCreateCharacter }) {
  const character = useActiveCharacter()
  const { characters, setActive, deleteCharacter, importCharacter } = useCharacterStore()
  const { activeSkinId, setSkin, customCSS, setCustomCSS } = useSkinStore()
  const [cssInput, setCssInput] = useState(customCSS)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const debouncedSetCSS = useDebounce(setCustomCSS, 400)

  const handleCSSChange = (e) => {
    setCssInput(e.target.value)
    debouncedSetCSS(e.target.value)
  }

  const handleClearCSS = () => {
    setCssInput('')
    setCustomCSS('')
  }

  const handleExport = () => {
    if (!character) return
    const blob = new Blob([JSON.stringify(character, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${character.meta.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        importCharacter(data)
      } catch {
        alert('Invalid character file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleDeleteCharacter = () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteCharacter(character.id)
    setConfirmDelete(false)
  }

  return (
    <div className="settings-screen">
      {/* Character management */}
      <div className="panel">
        <h3 className="panel-title">Characters</h3>
        <div className="char-list">
          {characters.map(c => (
            <button
              key={c.id}
              className={`char-item${c.id === character?.id ? ' active' : ''}`}
              onClick={() => setActive(c.id)}
            >
              <span className="char-item-name">{c.meta.name}</span>
              <span className="char-item-sub">{c.meta.race} {c.meta.class} {c.meta.level}</span>
            </button>
          ))}
        </div>

        <div className="settings-actions">
          <button className="action-btn accent" onClick={onCreateCharacter}>+ New Character</button>
          <button className="action-btn" onClick={handleExport} disabled={!character}>Export JSON</button>
          <label className="action-btn">
            Import JSON
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          {character && (
            <button
              className={`action-btn danger${confirmDelete ? ' confirm' : ''}`}
              onClick={handleDeleteCharacter}
              onBlur={() => setConfirmDelete(false)}
            >
              {confirmDelete ? 'Confirm Delete' : 'Delete Character'}
            </button>
          )}
        </div>
      </div>

      {/* Skin selector */}
      <div className="panel">
        <h3 className="panel-title">Skins</h3>
        <div className="skin-grid">
          {BUILT_IN_SKINS.map(skinId => (
            <button
              key={skinId}
              className={`skin-card${activeSkinId === skinId ? ' active' : ''}`}
              onClick={() => setSkin(skinId)}
            >
              <div className={`skin-preview skin-preview-${skinId}`} />
              <span className="skin-name">{SKIN_LABELS[skinId]}</span>
              <span className="skin-desc">{SKIN_DESCS[skinId]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom CSS — live injection, AO3-style */}
      <div className="panel">
        <h3 className="panel-title">Custom Skin CSS</h3>
        <p className="panel-help">
          Paste CSS and it applies instantly — no button needed. Share skins by posting this code block anywhere.
          Target CSS variables like <code>--s-bg-page</code>, <code>--s-color-accent</code>, or any class name.
        </p>
        <textarea
          className="custom-css-input"
          value={cssInput}
          onChange={handleCSSChange}
          placeholder=":root {&#10;  --s-color-accent: #ff6b6b;&#10;  --s-bg-page: #1a0a0a;&#10;}"
          rows={10}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
        {cssInput && (
          <button className="action-btn" onClick={handleClearCSS}>Clear CSS</button>
        )}

        <details className="var-reference">
          <summary>CSS Variable Reference</summary>
          <pre className="var-list">{CSS_VAR_REFERENCE}</pre>
        </details>
      </div>

      <div className="panel about-panel">
        <h3 className="panel-title">About</h3>
        <p className="about-text">Scroll &amp; Soul — D&amp;D 5e Character Sheet</p>
        <p className="about-text muted">Local-first · No account required · All data stored in browser</p>
      </div>
    </div>
  )
}

const CSS_VAR_REFERENCE = `/* Page & panels */
--s-bg-page          /* main page background */
--s-bg-panel         /* dark panel background */
--s-bg-panel-alt     /* light/parchment panel */
--s-bg-input         /* input field background */

/* Colors */
--s-color-accent     /* gold/primary accent */
--s-color-gem        /* proficiency indicator */
--s-color-text-primary
--s-color-text-panel
--s-color-text-muted
--s-color-hp
--s-color-spell
--s-color-proficient
--s-color-danger
--s-color-success
--s-overlay-bg       /* modal backdrop */

/* Typography */
--s-font-display     /* character name, headings */
--s-font-ui          /* labels, titles */
--s-font-body        /* descriptions, notes */
--s-font-code        /* code / CSS textarea */

/* Borders & shape */
--s-border-width
--s-border-radius
--s-panel-border     /* e.g. "2px solid gold" */
--s-input-border

/* Images — set to url('...') or none */
--s-img-bg-texture   /* full-page background */
--s-img-panel-border /* ornate frame via border-image */
--s-img-ability-orb  /* behind ability score circles */
--s-img-hp-shield    /* behind HP display */
--s-img-nav-bg       /* nav bar background */
--s-img-header-banner
--s-img-gem-filled
--s-img-gem-empty

/* Components */
--s-orb-size         /* ability orb diameter (default 72px) */
--s-nav-height       /* nav bar height (default 60px) */
--s-panel-padding    /* panel internal padding */`
