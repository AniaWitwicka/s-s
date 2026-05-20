import './SpellSlotTracker.css'

export default function SpellSlotTracker({ slots, onUse, onRecover }) {
  if (!slots || Object.keys(slots).length === 0) return null

  return (
    <div className="slot-tracker">
      {Object.entries(slots).map(([level, { total, used }]) => (
        <div key={level} className="slot-level">
          <span className="slot-level-label">{ordinal(Number(level))}</span>
          <div className="slot-gems">
            {Array.from({ length: total }, (_, i) => (
              <button
                key={i}
                className={`slot-gem${i < used ? ' used' : ''}`}
                onClick={() => i < used ? onRecover(Number(level)) : onUse(Number(level))}
                title={i < used ? 'Recover slot' : 'Use slot'}
              />
            ))}
          </div>
          <span className="slot-count">{total - used}/{total}</span>
        </div>
      ))}
    </div>
  )
}

function ordinal(n) {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
