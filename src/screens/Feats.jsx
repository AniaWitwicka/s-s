import { useState } from 'react'
import { useActiveCharacter, useCharacterStore } from '../store/characterStore.js'
import './Feats.css'

const SOURCE_LABELS = { feat: 'Feat', class: 'Class Feature', race: 'Racial Trait', background: 'Background' }

export default function Feats() {
  const character = useActiveCharacter()
  const { updateCharacter } = useCharacterStore()
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', source: 'feat', description: '' })

  if (!character) return null

  const { feats = [] } = character

  const grouped = feats.reduce((acc, f) => {
    const key = f.source || 'feat'
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})

  const handleAdd = () => {
    if (!form.name.trim()) return
    updateCharacter(character.id, {
      feats: [...feats, { id: crypto.randomUUID(), ...form }]
    })
    setForm({ name: '', source: 'feat', description: '' })
    setAdding(false)
  }

  const handleRemove = (featId) => {
    updateCharacter(character.id, { feats: feats.filter(f => f.id !== featId) })
  }

  return (
    <div className="feats-screen">
      <div className="panel">
        <div className="panel-header-row">
          <h3 className="panel-title">Feats & Features</h3>
          <button className="add-btn" onClick={() => setAdding(true)}>+ Add</button>
        </div>

        {adding && (
          <div className="add-feat-form">
            <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <div>
              <label className="form-label">Source</label>
              <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <textarea placeholder="Description" rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div className="add-feat-actions">
              <button className="btn" onClick={() => setAdding(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={handleAdd}>Add</button>
            </div>
          </div>
        )}

        {feats.length === 0 && !adding && <p className="empty-msg">No feats or features yet.</p>}

        {Object.entries(SOURCE_LABELS).map(([source, label]) => {
          const group = grouped[source] || []
          if (!group.length) return null
          return (
            <div key={source} className="feat-group">
              <div className="feat-group-header">{label}</div>
              {group.map(feat => (
                <FeatCard key={feat.id} feat={feat} onRemove={() => handleRemove(feat.id)} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeatCard({ feat, onRemove }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="feat-card">
      <div className="feat-card-header">
        <button className="feat-name" onClick={() => setOpen(o => !o)}>{feat.name}</button>
        <button className="item-remove" onClick={onRemove}>✕</button>
      </div>
      {open && feat.description && <p className="feat-desc">{feat.description}</p>}
    </div>
  )
}
