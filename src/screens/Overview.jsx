import { useActiveCharacter, useCharacterStore } from '../store/characterStore.js'
import { getModifier, getProficiencyBonus, getSavingThrow, getPassivePerception, ABILITY_ABBREVS } from '../engine/abilities.js'
import { getSpellSaveDC } from '../engine/spells.js'
import AbilityOrb from '../components/AbilityOrb.jsx'
import HPShield from '../components/HPShield.jsx'
import './Overview.css'

const SAVING_THROW_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export default function Overview({ onOpenRest, onOpenLevelUp }) {
  const character = useActiveCharacter()
  const { updateCharacter, updateHP } = useCharacterStore()

  if (!character) return null

  const { meta, abilities, hp, combat, skills, spells, savingThrowProficiencies = {} } = character
  const level = meta.level
  const prof = getProficiencyBonus(level)
  const spellDC = spells.known?.length > 0 ? getSpellSaveDC(character) : null

  const updateAbility = (key, val) =>
    updateCharacter(character.id, { abilities: { [key]: val } })

  const toggleSaveProficiency = (key) =>
    updateCharacter(character.id, {
      savingThrowProficiencies: {
        ...savingThrowProficiencies,
        [key]: !savingThrowProficiencies[key],
      },
    })

  const toggleInspiration = () =>
    updateCharacter(character.id, { combat: { inspiration: !combat.inspiration } })

  return (
    <div className="overview-screen">
      {/* Character banner */}
      <div className="character-banner">
        <div className="banner-portrait">
          {meta.portrait
            ? <img src={meta.portrait} alt={meta.name} />
            : <div className="portrait-placeholder">{meta.name[0]}</div>
          }
        </div>
        <div className="banner-info">
          <h1 className="character-name">{meta.name}</h1>
          <div className="character-subtitle">
            <span>{meta.race}</span>
            <span className="sep">·</span>
            <span>{meta.class}{meta.subclass ? ` (${meta.subclass})` : ''}</span>
            <span className="sep">·</span>
            <span>Level {level}</span>
          </div>
          <div className="character-detail">{meta.background} · {meta.alignment}</div>
          <div className="xp-row">
            <span className="xp-label">XP</span>
            <span className="xp-value">{meta.xp.toLocaleString()}</span>
            <button className="level-up-btn" onClick={onOpenLevelUp}>Level Up</button>
          </div>
        </div>
      </div>

      {/* HP + combat stats */}
      <div className="combat-row">
        <HPShield
          current={hp.current}
          max={hp.max}
          temp={hp.temp}
          onUpdate={(current, temp) => updateHP(character.id, current, temp)}
        />
        <div className="combat-stats">
          <StatBox label="AC" value={combat.ac} editable onEdit={v => updateCharacter(character.id, { combat: { ac: v } })} />
          <StatBox label="Initiative" value={getModifier(abilities.dex)} signed />
          <StatBox label="Speed" value={`${combat.speed}ft`} />
          {spellDC && <StatBox label="Spell DC" value={spellDC} />}
          <StatBox label="Prof" value={`+${prof}`} />
        </div>
      </div>

      {/* Ability orbs */}
      <div className="ability-orbs">
        {Object.keys(abilities).map(key => (
          <AbilityOrb
            key={key}
            abilityKey={key}
            score={abilities[key]}
            onUpdate={val => updateAbility(key, val)}
          />
        ))}
      </div>

      {/* Saving throws */}
      <div className="panel saves-panel">
        <h3 className="panel-title">Saving Throws</h3>
        <div className="saves-list">
          {SAVING_THROW_KEYS.map(key => {
            const proficient = savingThrowProficiencies[key] ?? false
            const total = getSavingThrow(abilities[key], proficient, level)
            const sign = total >= 0 ? '+' : ''
            return (
              <div key={key} className="save-row">
                <button
                  className={`gem${proficient ? ' gem-filled' : ''}`}
                  onClick={() => toggleSaveProficiency(key)}
                />
                <span className="save-bonus">{sign}{total}</span>
                <span className="save-label">{ABILITY_ABBREVS[key]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom row */}
      <div className="bottom-row">
        <div className="passive-perception panel">
          <span className="pp-label">Passive Perception</span>
          <span className="pp-value">{getPassivePerception(abilities.wis, skills.perception?.proficient, level)}</span>
        </div>

        <button
          className={`inspiration-btn${combat.inspiration ? ' active' : ''}`}
          onClick={toggleInspiration}
        >
          {combat.inspiration ? '★ Inspired' : '☆ Inspiration'}
        </button>
      </div>

      {/* Death saves (only when HP = 0) */}
      {hp.current === 0 && (
        <div className="panel death-saves-panel">
          <h3 className="panel-title">Death Saving Throws</h3>
          <DeathSaves
            successes={character.deathSaves.successes}
            failures={character.deathSaves.failures}
            onUpdate={(successes, failures) =>
              updateCharacter(character.id, { deathSaves: { successes, failures } })
            }
          />
        </div>
      )}

      {/* Rest buttons */}
      <div className="rest-row">
        <button className="rest-btn" onClick={() => onOpenRest('short')}>Short Rest</button>
        <button className="rest-btn rest-btn-long" onClick={() => onOpenRest('long')}>Long Rest</button>
      </div>
    </div>
  )
}

function StatBox({ label, value, signed, editable, onEdit }) {
  const display = signed && value >= 0 ? `+${value}` : value
  return (
    <div className="stat-box">
      <span className="stat-value">{display}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

function DeathSaves({ successes, failures, onUpdate }) {
  return (
    <div className="death-saves">
      <div className="ds-row">
        <span className="ds-label success">Successes</span>
        <div className="ds-gems">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              className={`gem${i < successes ? ' gem-filled gem-success' : ''}`}
              onClick={() => onUpdate(i < successes ? successes - 1 : successes + 1, failures)}
            />
          ))}
        </div>
      </div>
      <div className="ds-row">
        <span className="ds-label danger">Failures</span>
        <div className="ds-gems">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              className={`gem${i < failures ? ' gem-filled gem-danger' : ''}`}
              onClick={() => onUpdate(successes, i < failures ? failures - 1 : failures + 1)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
