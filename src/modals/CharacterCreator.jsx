import { useState } from 'react'
import { getModifier, getProficiencyBonus } from '../engine/abilities.js'
import { getHitDie } from '../engine/leveling.js'
import { getAvailableSpellSlots } from '../engine/spells.js'
import './Modal.css'
import './CharacterCreator.css'

const CLASSES = ['Barbarian','Bard','Cleric','Druid','Fighter','Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard']
const RACES = ['Dragonborn','Dwarf','Elf','Gnome','Half-Elf','Half-Orc','Halfling','Human','Tiefling']
const BACKGROUNDS = ['Acolyte','Charlatan','Criminal','Entertainer','Folk Hero','Guild Artisan','Hermit','Noble','Outlander','Sage','Sailor','Soldier','Urchin']
const ALIGNMENTS = ['Lawful Good','Neutral Good','Chaotic Good','Lawful Neutral','True Neutral','Chaotic Neutral','Lawful Evil','Neutral Evil','Chaotic Evil']
const SPELLCASTERS = ['Wizard','Sorcerer','Bard','Cleric','Druid','Paladin','Ranger','Warlock']
const SPELLCASTING_ABILITY = { Wizard: 'int', Sorcerer: 'cha', Bard: 'cha', Cleric: 'wis', Druid: 'wis', Paladin: 'cha', Ranger: 'wis', Warlock: 'cha' }

const POINT_BUY_COSTS = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }
const POINT_BUY_BUDGET = 27

export default function CharacterCreator({ onClose, onCreate }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    class: 'Fighter',
    race: 'Human',
    background: 'Soldier',
    alignment: 'True Neutral',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  })

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))
  const updateAbility = (key, val) => setForm(f => ({ ...f, abilities: { ...f.abilities, [key]: val } }))

  const pointsSpent = Object.values(form.abilities).reduce(
    (sum, v) => sum + (POINT_BUY_COSTS[v] ?? 0), 0
  )
  const pointsLeft = POINT_BUY_BUDGET - pointsSpent

  const hitDie = getHitDie(form.class)
  const conMod = getModifier(form.abilities.con)
  const startingHP = hitDie + conMod
  const isSpellcaster = SPELLCASTERS.includes(form.class)

  const handleCreate = () => {
    const slots = isSpellcaster ? getAvailableSpellSlots(form.class, 1) : {}
    const spellcastingAbility = SPELLCASTING_ABILITY[form.class] || 'int'

    onCreate({
      meta: {
        name: form.name || 'New Adventurer',
        class: form.class,
        subclass: '',
        race: form.race,
        background: form.background,
        alignment: form.alignment,
        xp: 0,
        level: 1,
      },
      abilities: form.abilities,
      hp: {
        max: startingHP,
        current: startingHP,
        temp: 0,
        hitDice: { total: 1, remaining: 1, type: `d${hitDie}` },
      },
      spells: { spellcastingAbility, slots, known: [] },
    })
  }

  const steps = [
    <StepIdentity form={form} update={update} />,
    <StepAbilities form={form} updateAbility={updateAbility} pointsLeft={pointsLeft} />,
    <StepReview form={form} startingHP={startingHP} hitDie={hitDie} isSpellcaster={isSpellcaster} />,
  ]

  const stepTitles = ['Identity', 'Abilities', 'Review']

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">New Character — {stepTitles[step]}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="step-indicators">
          {stepTitles.map((t, i) => (
            <div key={i} className={`step-dot${i === step ? ' active' : i < step ? ' done' : ''}`} />
          ))}
        </div>

        <div className="modal-body">{steps[step]}</div>

        <div className="modal-footer">
          {step > 0 && <button className="btn" onClick={() => setStep(s => s - 1)}>Back</button>}
          <div style={{ flex: 1 }} />
          {step < steps.length - 1 ? (
            <button className="btn btn-accent" onClick={() => setStep(s => s + 1)}>Next</button>
          ) : (
            <button className="btn btn-accent" onClick={handleCreate}>Create Character</button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepIdentity({ form, update }) {
  return (
    <div className="creator-step">
      <Field label="Name">
        <input type="text" value={form.name} onChange={e => update('name', e.target.value)} placeholder="Adventurer's name" />
      </Field>
      <Field label="Class">
        <select value={form.class} onChange={e => update('class', e.target.value)}>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Race">
        <select value={form.race} onChange={e => update('race', e.target.value)}>
          {RACES.map(r => <option key={r}>{r}</option>)}
        </select>
      </Field>
      <Field label="Background">
        <select value={form.background} onChange={e => update('background', e.target.value)}>
          {BACKGROUNDS.map(b => <option key={b}>{b}</option>)}
        </select>
      </Field>
      <Field label="Alignment">
        <select value={form.alignment} onChange={e => update('alignment', e.target.value)}>
          {ALIGNMENTS.map(a => <option key={a}>{a}</option>)}
        </select>
      </Field>
    </div>
  )
}

function StepAbilities({ form, updateAbility, pointsLeft }) {
  const KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha']
  const LABELS = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }

  return (
    <div className="creator-step">
      <div className="points-budget">
        Point Buy — <span className={pointsLeft < 0 ? 'danger' : 'accent'}>{pointsLeft} pts left</span>
      </div>
      {KEYS.map(key => {
        const score = form.abilities[key]
        const mod = getModifier(score)
        return (
          <div key={key} className="ability-row">
            <span className="ability-row-label">{LABELS[key]}</span>
            <button className="adj-btn" onClick={() => score > 8 && updateAbility(key, score - 1)}>-</button>
            <span className="ability-row-score">{score}</span>
            <button className="adj-btn" onClick={() => score < 15 && pointsLeft > 0 && updateAbility(key, score + 1)}>+</button>
            <span className="ability-row-mod">{mod >= 0 ? `+${mod}` : mod}</span>
          </div>
        )
      })}
    </div>
  )
}

function StepReview({ form, startingHP, hitDie, isSpellcaster }) {
  const prof = getProficiencyBonus(1)
  return (
    <div className="creator-step">
      <div className="review-grid">
        <ReviewItem label="Name" value={form.name || '—'} />
        <ReviewItem label="Class" value={form.class} />
        <ReviewItem label="Race" value={form.race} />
        <ReviewItem label="Background" value={form.background} />
        <ReviewItem label="Alignment" value={form.alignment} />
        <ReviewItem label="Hit Die" value={`d${hitDie}`} />
        <ReviewItem label="Starting HP" value={startingHP} />
        <ReviewItem label="Proficiency Bonus" value={`+${prof}`} />
        {isSpellcaster && <ReviewItem label="Spellcaster" value="Yes" />}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

function ReviewItem({ label, value }) {
  return (
    <div className="review-item">
      <span className="review-label">{label}</span>
      <span className="review-value">{value}</span>
    </div>
  )
}
