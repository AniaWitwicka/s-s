import { useActiveCharacter, useCharacterStore } from '../store/characterStore.js'
import './Journal.css'

const SHORT_FIELDS = [
  { key: 'personalityTraits', label: 'Personality Traits' },
  { key: 'ideals', label: 'Ideals' },
  { key: 'bonds', label: 'Bonds' },
  { key: 'flaws', label: 'Flaws' },
]

export default function Journal() {
  const character = useActiveCharacter()
  const { updateCharacter } = useCharacterStore()

  if (!character) return null

  const { notes } = character

  const setNote = (key, val) => updateCharacter(character.id, { notes: { [key]: val } })

  return (
    <div className="journal-screen">
      <div className="panel">
        {SHORT_FIELDS.map(({ key, label }) => (
          <div key={key} className="note-field">
            <label className="note-label">{label}</label>
            <textarea
              className="note-input note-input-short"
              value={notes[key] || ''}
              onChange={e => setNote(key, e.target.value)}
              placeholder={`${label}...`}
              rows={2}
            />
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="note-field">
          <label className="note-label">Backstory</label>
          <textarea
            className="note-input"
            value={notes.backstory || ''}
            onChange={e => setNote('backstory', e.target.value)}
            placeholder="Your character's history..."
            rows={8}
          />
        </div>
      </div>

      <div className="panel">
        <div className="note-field">
          <label className="note-label">Session Notes</label>
          <textarea
            className="note-input"
            value={notes.sessionNotes || ''}
            onChange={e => setNote('sessionNotes', e.target.value)}
            placeholder="Notes from recent sessions..."
            rows={10}
          />
        </div>
      </div>
    </div>
  )
}
