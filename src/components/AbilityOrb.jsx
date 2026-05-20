import { useState } from 'react'
import { getModifier, ABILITY_ABBREVS } from '../engine/abilities.js'
import './AbilityOrb.css'

export default function AbilityOrb({ abilityKey, score, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(score))
  const mod = getModifier(score)

  const commit = () => {
    const val = parseInt(draft, 10)
    if (!isNaN(val) && val >= 1 && val <= 30) onUpdate(val)
    setEditing(false)
  }

  return (
    <div className="ability-orb">
      <div className="orb-modifier">{mod >= 0 ? `+${mod}` : mod}</div>
      <div className="orb-body">
        {editing ? (
          <input
            className="orb-input"
            type="number"
            value={draft}
            min={1}
            max={30}
            autoFocus
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit() }}
          />
        ) : (
          <button className="orb-score" onClick={() => { setDraft(String(score)); setEditing(true) }}>
            {score}
          </button>
        )}
      </div>
      <div className="orb-label">{ABILITY_ABBREVS[abilityKey]}</div>
    </div>
  )
}
