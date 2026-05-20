import { useState } from 'react'
import { useActiveCharacter, useCharacterStore } from '../store/characterStore.js'
import './Inventory.css'

const CARRY_MULTIPLIER = 15

export default function Inventory() {
  const character = useActiveCharacter()
  const { updateCharacter, addItem, removeItem, toggleEquipped } = useCharacterStore()
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, weight: 0, equipped: false, description: '' })

  if (!character) return null

  const { inventory } = character
  const totalWeight = inventory.items.reduce((s, i) => s + (i.weight * i.quantity), 0)
  const carryCapacity = character.abilities.str * CARRY_MULTIPLIER

  const setCurrency = (coin, val) => {
    const n = parseInt(val, 10)
    if (isNaN(n) || n < 0) return
    updateCharacter(character.id, { inventory: { currency: { [coin]: n } } })
  }

  const handleAdd = () => {
    if (!newItem.name.trim()) return
    addItem(character.id, { ...newItem, quantity: Number(newItem.quantity), weight: Number(newItem.weight) })
    setNewItem({ name: '', quantity: 1, weight: 0, equipped: false, description: '' })
    setAdding(false)
  }

  const COINS = [
    { key: 'pp', label: 'PP', color: 'var(--s-color-spell)' },
    { key: 'gp', label: 'GP', color: 'var(--s-color-accent)' },
    { key: 'ep', label: 'EP', color: 'var(--s-color-text-muted)' },
    { key: 'sp', label: 'SP', color: 'var(--s-color-text-muted)' },
    { key: 'cp', label: 'CP', color: '#a05020' },
  ]

  return (
    <div className="inventory-screen">
      {/* Currency */}
      <div className="panel">
        <h3 className="panel-title">Currency</h3>
        <div className="currency-row">
          {COINS.map(({ key, label, color }) => (
            <div key={key} className="coin-block">
              <input
                type="number"
                min={0}
                value={inventory.currency[key]}
                onChange={e => setCurrency(key, e.target.value)}
                className="coin-input"
              />
              <span className="coin-label" style={{ color }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Carry capacity */}
      <div className="panel carry-panel">
        <div className="carry-info">
          <span className="carry-label">Encumbrance</span>
          <span className="carry-value">{totalWeight} / {carryCapacity} lbs</span>
        </div>
        <div className="carry-track">
          <div className="carry-fill" style={{ width: `${Math.min(100, (totalWeight / carryCapacity) * 100)}%` }} />
        </div>
      </div>

      {/* Item list */}
      <div className="panel items-panel">
        <div className="panel-header-row">
          <h3 className="panel-title">Items ({inventory.items.length})</h3>
          <button className="add-btn" onClick={() => setAdding(true)}>+ Add Item</button>
        </div>

        {adding && (
          <div className="add-item-form">
            <input placeholder="Item name" value={newItem.name} onChange={e => setNewItem(f => ({ ...f, name: e.target.value }))} />
            <div className="add-item-row">
              <div>
                <label className="form-label">Qty</label>
                <input type="number" min={1} value={newItem.quantity} onChange={e => setNewItem(f => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Weight (lbs)</label>
                <input type="number" min={0} step={0.1} value={newItem.weight} onChange={e => setNewItem(f => ({ ...f, weight: e.target.value }))} />
              </div>
            </div>
            <textarea placeholder="Description (optional)" rows={2} value={newItem.description}
              onChange={e => setNewItem(f => ({ ...f, description: e.target.value }))} />
            <div className="add-item-actions">
              <button className="btn" onClick={() => setAdding(false)}>Cancel</button>
              <button className="btn btn-accent" onClick={handleAdd}>Add</button>
            </div>
          </div>
        )}

        <div className="items-list">
          {inventory.items.length === 0 && <p className="empty-msg">No items yet.</p>}
          {inventory.items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              onToggleEquip={() => toggleEquipped(character.id, item.id)}
              onRemove={() => removeItem(character.id, item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ItemRow({ item, onToggleEquip, onRemove }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="item-row">
      <button className={`equip-gem${item.equipped ? ' equipped' : ''}`} onClick={onToggleEquip} title="Toggle equipped" />
      <button className="item-name" onClick={() => setOpen(o => !o)}>{item.name}</button>
      <span className="item-qty">×{item.quantity}</span>
      <span className="item-weight">{item.weight * item.quantity}lb</span>
      <button className="item-remove" onClick={onRemove} title="Remove">✕</button>
      {open && item.description && (
        <div className="item-desc">{item.description}</div>
      )}
    </div>
  )
}
