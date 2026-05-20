import { useState } from 'react'
import { useActiveCharacter, useCharacterStore } from '../store/characterStore.js'
import { getSpellSaveDC, getSpellAttackBonus } from '../engine/spells.js'
import SpellSlotTracker from '../components/SpellSlotTracker.jsx'
import './Spellbook.css'

export default function Spellbook() {
  const character = useActiveCharacter()
  const { useSpellSlot, recoverSpellSlot, updateCharacter } = useCharacterStore()
  const [adding, setAdding] = useState(false)
  const [newSpell, setNewSpell] = useState({ name: '', level: 0, school: 'Evocation', castingTime: '1 action', range: '', components: '', duration: '', description: '', prepared: true })
  const [expandedId, setExpandedId] = useState(null)

  if (!character) return null

  const { spells } = character
  const dc = getSpellSaveDC(character)
  const atk = getSpellAttackBonus(character)

  const spellsByLevel = {}
  for (const spell of (spells.known || [])) {
    const lvl = spell.level
    if (!spellsByLevel[lvl]) spellsByLevel[lvl] = []
    spellsByLevel[lvl].push(spell)
  }

  const handleAdd = () => {
    if (!newSpell.name.trim()) return
    const id = crypto.randomUUID()
    updateCharacter(character.id, {
      spells: { known: [...(spells.known || []), { ...newSpell, id, level: Number(newSpell.level) }] }
    })
    setNewSpell({ name: '', level: 0, school: 'Evocation', castingTime: '1 action', range: '', components: '', duration: '', description: '', prepared: true })
    setAdding(false)
  }

  const removeSpell = (spellId) => {
    updateCharacter(character.id, { spells: { known: spells.known.filter(s => s.id !== spellId) } })
  }

  const togglePrepared = (spellId) => {
    updateCharacter(character.id, {
      spells: { known: spells.known.map(s => s.id === spellId ? { ...s, prepared: !s.prepared } : s) }
    })
  }

  const SCHOOLS = ['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation']

  return (
    <div className="spellbook-screen">
      <div className="spell-stats panel">
        <div className="spell-stat"><span className="ss-label">Save DC</span><span className="ss-value">{dc}</span></div>
        <div className="spell-stat"><span className="ss-label">Atk Bonus</span><span className="ss-value">+{atk}</span></div>
        <div className="spell-stat"><span className="ss-label">Ability</span><span className="ss-value">{spells.spellcastingAbility?.toUpperCase()}</span></div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Spell Slots</h3>
        <SpellSlotTracker
          slots={spells.slots}
          onUse={lvl => useSpellSlot(character.id, lvl)}
          onRecover={lvl => recoverSpellSlot(character.id, lvl)}
        />
        {(!spells.slots || Object.keys(spells.slots).length === 0) && (
          <p className="empty-msg">No spell slots (non-spellcaster or level 0)</p>
        )}
      </div>

      <div className="panel spells-panel">
        <div className="panel-header-row">
          <h3 className="panel-title">Spells Known ({spells.known?.length || 0})</h3>
          <button className="add-btn" onClick={() => setAdding(true)}>+ Add Spell</button>
        </div>

        {adding && (
          <div className="add-spell-form">
            <input placeholder="Spell name" value={newSpell.name} onChange={e => setNewSpell(f => ({ ...f, name: e.target.value }))} />
            <div className="add-spell-row">
              <div>
                <label className="form-label">Level (0 = cantrip)</label>
                <input type="number" min={0} max={9} value={newSpell.level} onChange={e => setNewSpell(f => ({ ...f, level: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">School</label>
                <select value={newSpell.school} onChange={e => setNewSpell(f => ({ ...f, school: e.target.value }))}>
                  {SCHOOLS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="add-spell-row">
              <div>
                <label className="form-label">Casting Time</label>
                <input value={newSpell.castingTime} onChange={e => setNewSpell(f => ({ ...f, castingTime: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Range</label>
                <input value={newSpell.range} onChange={e => setNewSpell(f => ({ ...f, range: e.target.value }))} />
              </div>
            </div>
            <div className="add-spell-row">
              <div>
                <label className="form-label">Components</label>
                <input value={newSpell.components} onChange={e => setNewSpell(f => ({ ...f, components: e.target.value }))} placeholder="V, S, M" />
              </div>
              <div>
                <label className="form-label">Duration</label>
                <input value={newSpell.duration} onChange={e => setNewSpell(f => ({ ...f, duration: e.target.value }))} />
              </div>
            </div>
            <textarea placeholder="Description" rows={3} value={newSpell.description}
              onChange={e => setNewSpell(f => ({ ...f, description: e.target.value }))} />
            <div className="add-spell-actions">
              <button className="btn" onClick={() => setAdding(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={handleAdd}>Add Spell</button>
            </div>
          </div>
        )}

        {[...new Set([0, ...Object.keys(spellsByLevel).map(Number)])].sort((a, b) => a - b).map(lvl => {
          const group = spellsByLevel[lvl] || []
          if (group.length === 0 && lvl !== 0) return null
          return (
            <div key={lvl} className="spell-level-group">
              <div className="spell-level-header">
                {lvl === 0 ? 'Cantrips' : `${ordinal(lvl)} Level`}
              </div>
              {group.length === 0
                ? <p className="empty-msg empty-msg-sm">No {lvl === 0 ? 'cantrips' : `${ordinal(lvl)}-level spells`} yet.</p>
                : group.map(spell => (
                  <SpellRow
                    key={spell.id}
                    spell={spell}
                    expanded={expandedId === spell.id}
                    onToggle={() => setExpandedId(id => id === spell.id ? null : spell.id)}
                    onTogglePrepared={() => togglePrepared(spell.id)}
                    onRemove={() => removeSpell(spell.id)}
                  />
                ))
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SpellRow({ spell, expanded, onToggle, onTogglePrepared, onRemove }) {
  return (
    <div className={`spell-row${expanded ? ' open' : ''}`}>
      <div className="spell-row-main">
        {spell.level > 0 && (
          <button
            className={`gem${spell.prepared ? ' gem-filled' : ''}`}
            onClick={onTogglePrepared}
            title="Prepared"
          />
        )}
        {spell.level === 0 && <div style={{ width: 14 }} />}
        <button className="spell-name" onClick={onToggle}>{spell.name}</button>
        <span className="spell-school">{spell.school}</span>
        <button className="item-remove" onClick={onRemove}>✕</button>
      </div>
      {expanded && (
        <div className="spell-detail">
          <div className="spell-meta-grid">
            {spell.castingTime && <SpellMeta label="Casting Time" value={spell.castingTime} />}
            {spell.range && <SpellMeta label="Range" value={spell.range} />}
            {spell.components && <SpellMeta label="Components" value={spell.components} />}
            {spell.duration && <SpellMeta label="Duration" value={spell.duration} />}
          </div>
          {spell.description && <p className="spell-desc">{spell.description}</p>}
        </div>
      )}
    </div>
  )
}

function SpellMeta({ label, value }) {
  return (
    <div className="spell-meta-item">
      <span className="spell-meta-label">{label}</span>
      <span className="spell-meta-value">{value}</span>
    </div>
  )
}

function ordinal(n) {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
