import { useState } from 'react'
import { getModifier } from '../engine/abilities.js'
import { getLevelUpSteps, getHitDie } from '../engine/leveling.js'
import './Modal.css'
import './LevelUpWizard.css'

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const ABILITY_LABELS = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }

export default function LevelUpWizard({ character, onApply, onClose }) {
  const steps = getLevelUpSteps(character)
  const [stepIdx, setStepIdx] = useState(0)
  const [choices, setChoices] = useState([])
  const [hpRoll, setHpRoll] = useState(null)
  const [asiChoice, setAsiChoice] = useState(null) // 'asi' | 'feat'
  const [asiAllocation, setAsiAllocation] = useState({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 })
  const [asiMode, setAsiMode] = useState(null) // '+2' | '+1+1'
  const [featName, setFeatName] = useState('')
  const [featDesc, setFeatDesc] = useState('')

  const newLevel = character.meta.level + 1
  const hitDie = getHitDie(character.meta.class)
  const conMod = getModifier(character.abilities.con)

  const rollHP = () => {
    const roll = Math.floor(Math.random() * hitDie) + 1
    const gain = Math.max(1, roll + conMod)
    setHpRoll(gain)
  }

  const currentStep = steps[stepIdx]

  const canAdvance = () => {
    if (!currentStep) return true
    if (currentStep.type === 'hp-roll') return hpRoll !== null
    if (currentStep.type === 'asi-or-feat') {
      if (asiChoice === 'feat') return featName.trim().length > 0
      if (asiChoice === 'asi') {
        const total = Object.values(asiAllocation).reduce((s, v) => s + v, 0)
        return total === 2
      }
      return false
    }
    return true
  }

  const advance = () => {
    const newChoices = [...choices]

    if (currentStep?.type === 'hp-roll' && hpRoll !== null) {
      newChoices.push({ type: 'hp-roll', value: hpRoll })
    }
    if (currentStep?.type === 'asi-or-feat') {
      if (asiChoice === 'asi') {
        const changes = Object.fromEntries(
          Object.entries(asiAllocation).filter(([, v]) => v > 0).map(([k, v]) => [k, character.abilities[k] + v])
        )
        newChoices.push({ type: 'asi', changes })
      } else if (asiChoice === 'feat') {
        newChoices.push({ type: 'feat', feat: { id: crypto.randomUUID(), name: featName, source: 'feat', description: featDesc } })
      }
    }
    if (currentStep?.type === 'spell-slots') {
      newChoices.push({ type: 'spell-slots' })
    }

    setChoices(newChoices)

    if (stepIdx < steps.length - 1) {
      setStepIdx(i => i + 1)
    } else {
      onApply(character.id, newChoices)
      onClose()
    }
  }

  const asiPointsLeft = 2 - Object.values(asiAllocation).reduce((s, v) => s + v, 0)
  const adjustASI = (key, delta) => {
    const newVal = asiAllocation[key] + delta
    if (newVal < 0) return
    if (asiMode === '+2' && newVal > 2) return
    if (asiMode === '+1+1' && newVal > 1) return
    const total = Object.values(asiAllocation).reduce((s, v) => s + v, 0) + delta
    if (total > 2 || total < 0) return
    setAsiAllocation(a => ({ ...a, [key]: newVal }))
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Level {newLevel}!</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="step-indicators">
          {steps.map((_, i) => (
            <div key={i} className={`step-dot${i === stepIdx ? ' active' : i < stepIdx ? ' done' : ''}`} />
          ))}
        </div>

        <div className="modal-body">
          {!currentStep && <p className="lu-congrats">Level up complete! All changes will be applied.</p>}

          {currentStep?.type === 'hp-roll' && (
            <div className="lu-step">
              <h3 className="lu-step-title">Hit Points</h3>
              <p className="lu-desc">Roll your {hitDie}-sided hit die (+ {conMod >= 0 ? '+' : ''}{conMod} CON)</p>
              <button className="btn btn-accent lu-roll-btn" onClick={rollHP}>
                Roll d{hitDie}
              </button>
              {hpRoll !== null && (
                <div className="lu-result">
                  <span className="lu-result-value">+{hpRoll} HP</span>
                  <span className="lu-result-sub">New max: {character.hp.max + hpRoll}</span>
                </div>
              )}
              <div className="lu-manual">
                <span className="lu-desc">or enter manually:</span>
                <input
                  type="number"
                  min={1}
                  max={hitDie + conMod}
                  value={hpRoll ?? ''}
                  onChange={e => setHpRoll(parseInt(e.target.value, 10) || null)}
                  className="lu-input"
                  placeholder="HP gained"
                />
              </div>
            </div>
          )}

          {currentStep?.type === 'asi-or-feat' && (
            <div className="lu-step">
              <h3 className="lu-step-title">Ability Score Improvement</h3>
              <div className="asi-choice-row">
                <button className={`asi-choice-btn${asiChoice === 'asi' ? ' active' : ''}`} onClick={() => setAsiChoice('asi')}>
                  Ability Score Improvement
                </button>
                <button className={`asi-choice-btn${asiChoice === 'feat' ? ' active' : ''}`} onClick={() => setAsiChoice('feat')}>
                  Take a Feat
                </button>
              </div>

              {asiChoice === 'asi' && (
                <>
                  <div className="asi-mode-row">
                    <button className={`asi-mode-btn${asiMode === '+2' ? ' active' : ''}`} onClick={() => { setAsiMode('+2'); setAsiAllocation({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }) }}>+2 to one stat</button>
                    <button className={`asi-mode-btn${asiMode === '+1+1' ? ' active' : ''}`} onClick={() => { setAsiMode('+1+1'); setAsiAllocation({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }) }}>+1 to two stats</button>
                  </div>
                  <p className="lu-desc">Points remaining: {asiPointsLeft}</p>
                  {asiMode && ABILITY_KEYS.map(key => (
                    <div key={key} className="asi-row">
                      <span className="asi-label">{ABILITY_LABELS[key]}</span>
                      <span className="asi-current">{character.abilities[key]}</span>
                      <button className="adj-btn" onClick={() => adjustASI(key, -1)} disabled={asiAllocation[key] === 0}>-</button>
                      <span className="asi-delta">{asiAllocation[key] > 0 ? `+${asiAllocation[key]}` : '—'}</span>
                      <button className="adj-btn" onClick={() => adjustASI(key, 1)} disabled={asiPointsLeft === 0}>+</button>
                      <span className="asi-new">{character.abilities[key] + asiAllocation[key]}</span>
                    </div>
                  ))}
                </>
              )}

              {asiChoice === 'feat' && (
                <div className="feat-entry">
                  <input placeholder="Feat name" value={featName} onChange={e => setFeatName(e.target.value)} />
                  <textarea placeholder="Description (optional)" rows={3} value={featDesc} onChange={e => setFeatDesc(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {currentStep?.type === 'spell-slots' && (
            <div className="lu-step">
              <h3 className="lu-step-title">Spell Slots</h3>
              <p className="lu-desc">Your spell slots will be updated automatically for level {newLevel}.</p>
            </div>
          )}

          {currentStep?.type === 'subclass' && (
            <div className="lu-step">
              <h3 className="lu-step-title">Choose Subclass</h3>
              <p className="lu-desc">You can set your subclass from the Overview screen after leveling up.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {stepIdx > 0 && <button className="btn" onClick={() => setStepIdx(i => i - 1)}>Back</button>}
          <div style={{ flex: 1 }} />
          <button className="btn btn-accent" onClick={advance} disabled={!canAdvance()}>
            {stepIdx < steps.length - 1 ? 'Next' : 'Apply Level Up'}
          </button>
        </div>
      </div>
    </div>
  )
}
