import { useState } from 'react'
import { getModifier } from '../engine/abilities.js'
import './Modal.css'
import './RestModal.css'

function RestResetItem({ label, value }) {
  return (
    <div className="rest-reset-item">
      <span className="rest-reset-label">{label}</span>
      <span className="rest-reset-value">{value}</span>
    </div>
  )
}

export default function RestModal({ type, character, onRest, onClose }) {
  const [hpGained, setHpGained] = useState(0)
  const conMod = getModifier(character.abilities.con)
  const { hp } = character
  const diceRemaining = hp.hitDice.remaining

  const rollDie = (sides) => Math.floor(Math.random() * sides) + 1

  const rollHitDie = () => {
    if (diceRemaining <= 0) return
    const roll = rollDie(parseInt(hp.hitDice.type.slice(1), 10))
    const gain = Math.max(1, roll + conMod)
    setHpGained(g => Math.min(g + gain, hp.max - hp.current))
  }

  const handleShortRest = () => {
    onRest('short', hpGained)
    onClose()
  }

  const handleLongRest = () => {
    onRest('long', 0)
    onClose()
  }

  if (type === 'long') {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-box">
          <div className="modal-header">
            <h2 className="modal-title">Long Rest</h2>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
          <div className="modal-body">
            <div className="rest-preview">
              <RestResetItem label="HP" value={`→ ${hp.max} (full)`} />
              <RestResetItem label="Temp HP" value="→ 0" />
              <RestResetItem label="Spell Slots" value="All recovered" />
              <RestResetItem label="Death Saves" value="Reset" />
              <RestResetItem
                label="Hit Dice Recovered"
                value={`+${Math.max(1, Math.floor(character.meta.level / 2))}`}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={onClose}>Cancel</button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-accent" onClick={handleLongRest}>Take Long Rest</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Short Rest</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="short-rest-info">
            <div className="sr-stat">
              <span className="sr-label">Current HP</span>
              <span className="sr-value" style={{ color: 'var(--s-color-hp)' }}>{hp.current}</span>
            </div>
            <div className="sr-stat">
              <span className="sr-label">Max HP</span>
              <span className="sr-value">{hp.max}</span>
            </div>
            <div className="sr-stat">
              <span className="sr-label">Hit Dice Left</span>
              <span className="sr-value">{diceRemaining}/{hp.hitDice.total} ({hp.hitDice.type})</span>
            </div>
          </div>

          <div className="sr-roll-section">
            <button
              className="btn btn-accent sr-roll-btn"
              onClick={rollHitDie}
              disabled={diceRemaining <= 0 || hp.current >= hp.max}
            >
              Roll {hp.hitDice.type} + {conMod >= 0 ? `+${conMod}` : conMod} CON
            </button>
            {hpGained > 0 && (
              <p className="sr-gained">Will recover: <strong style={{ color: 'var(--s-color-success)' }}>+{hpGained} HP</strong> → {hp.current + hpGained}</p>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-accent" onClick={handleShortRest}>Finish Rest</button>
        </div>
      </div>
    </div>
  )
}
