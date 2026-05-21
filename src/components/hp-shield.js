export function hpShield({ current, max, temp }) {
  return `
    <div class="hp-shield">
      <div class="hp-shield__values">
        <span class="hp-shield__current">${current}</span>
        <span class="hp-shield__max">/ ${max}</span>
      </div>
      ${temp ? `<span class="hp-shield__temp">+${temp} temp</span>` : ''}
    </div>
  `
}
