import { useState } from 'react'
import './HPShield.css'

export default function HPShield({ current, max, temp, onUpdate }) {
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState('')

  const startEdit = (field) => {
    setEditing(field)
    setDraft(String(field === 'current' ? current : field === 'max' ? max : temp))
  }

  const commit = () => {
    const val = parseInt(draft, 10)
    if (!isNaN(val) && val >= 0) {
      if (editing === 'current') onUpdate(Math.min(val, max), temp)
      else if (editing === 'max') onUpdate(Math.min(current, val), temp)
      else if (editing === 'temp') onUpdate(current, val)
    }
    setEditing(null)
  }

  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0
  const hpColor = pct > 50 ? 'var(--s-color-success)' : pct > 25 ? 'var(--s-color-accent)' : 'var(--s-color-hp)'

  return (
    <div className="hp-shield">
      <div className="hp-bar-track">
        <div className="hp-bar-fill" style={{ width: `${pct}%`, background: hpColor }} />
      </div>

      <div className="hp-values">
        <div className="hp-current-block">
          {editing === 'current' ? (
            <input className="hp-input" type="number" value={draft} min={0} max={max} autoFocus
              onChange={e => setDraft(e.target.value)} onBlur={commit}
              onKeyDown={e => e.key === 'Enter' && commit()} />
          ) : (
            <button className="hp-number hp-current" onClick={() => startEdit('current')}
              style={{ color: hpColor }}>
              {current}
            </button>
          )}
          <span className="hp-sep">/</span>
          {editing === 'max' ? (
            <input className="hp-input" type="number" value={draft} min={1} autoFocus
              onChange={e => setDraft(e.target.value)} onBlur={commit}
              onKeyDown={e => e.key === 'Enter' && commit()} />
          ) : (
            <button className="hp-number hp-max" onClick={() => startEdit('max')}>{max}</button>
          )}
        </div>

        {(temp > 0 || editing === 'temp') && (
          <div className="hp-temp-block">
            <span className="hp-temp-label">TMP</span>
            {editing === 'temp' ? (
              <input className="hp-input hp-input-sm" type="number" value={draft} min={0} autoFocus
                onChange={e => setDraft(e.target.value)} onBlur={commit}
                onKeyDown={e => e.key === 'Enter' && commit()} />
            ) : (
              <button className="hp-number" onClick={() => startEdit('temp')}>{temp}</button>
            )}
          </div>
        )}
      </div>

      <div className="hp-label">Hit Points</div>
    </div>
  )
}
