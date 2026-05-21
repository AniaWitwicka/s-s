import { formatModifier } from '../engine/abilities.js'

export function abilityOrb({ label, score, modifier }) {
  return `
    <div class="ability-orb" data-ability="${label.toLowerCase()}">
      <div class="ability-orb__frame">
        <span class="ability-orb__score">${score}</span>
        <span class="ability-orb__mod">${formatModifier(modifier)}</span>
      </div>
      <span class="ability-orb__label">${label}</span>
    </div>
  `
}
