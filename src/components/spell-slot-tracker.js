// spellSlots: { 1: { max, used }, 2: { max, used }, ... }
export function spellSlotTracker(spellSlots) {
  const levels = Object.entries(spellSlots).filter(([, s]) => s.max > 0)
  if (!levels.length) return '<p class="skill-row__ability">No spell slots</p>'

  return `
    <div class="spell-slot-tracker">
      ${levels.map(([level, { max, used }]) => `
        <div class="spell-slot-level" data-slot-level="${level}">
          <span class="spell-slot-level__label">${_ordinal(level)}</span>
          <div class="spell-slot-level__pips">
            ${Array.from({ length: max }, (_, i) => `
              <button
                class="spell-slot-pip${i < used ? ' spell-slot-pip--used' : ''}"
                data-slot-level="${level}"
                data-slot-index="${i}"
                aria-label="Spell slot ${i + 1} of ${max} at level ${level}"
              ></button>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `
}

function _ordinal(n) {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}
