import { formatModifier } from '../engine/abilities.js'

export function skillRow({ id, label, ability, bonus, proficient, expertise }) {
  const gemClass = expertise ? 'gem gem--expertise'
                 : proficient ? 'gem gem--filled'
                 : 'gem'
  return `
    <div class="skill-row" data-skill="${id}">
      <span class="${gemClass}"></span>
      <span class="skill-row__bonus">${formatModifier(bonus)}</span>
      <span class="skill-row__label">${label}</span>
      <span class="skill-row__ability">${ability.toUpperCase()}</span>
    </div>
  `
}
