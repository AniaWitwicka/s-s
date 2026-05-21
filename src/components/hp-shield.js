export function hpShield({ current, max, temp }) {
  return `
    <div class="hp-shield">
      <span class="hp-shield__current">${current}</span>
      <span class="hp-shield__max">/ ${max}</span>
      ${temp ? `<span class="hp-shield__temp">+${temp} temp</span>` : ''}
    </div>
  `
}
