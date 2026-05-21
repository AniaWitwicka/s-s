import { store } from '../store.js'
import { abilityOrb } from '../components/ability-orb.js'
import { hpShield } from '../components/hp-shield.js'
import { statBadge } from '../components/stat-badge.js'
import { getModifier, getProficiencyBonus, getSavingThrow, formatModifier, ABILITY_KEYS, ABILITY_LABELS } from '../engine/abilities.js'
import { open as openRest } from '../modals/rest.js'
import { open as openLevelUp } from '../modals/level-up.js'

export function render(container) {
  const char = store.getActiveCharacter()
  if (!char) { container.innerHTML = '<p style="padding:1rem">No character found.</p>'; return }

  const level       = Number(char.meta.level)         || 1
  const ac          = Number(char.combat.ac)           || 10
  const speed       = Number(char.combat.speed)        || 30
  const spellAbility = char.combat.spellcastingAbility || 'int'
  const prof        = getProficiencyBonus(level)
  const initMod     = getModifier(Number(char.abilities.dex) || 10)
  const spellDC     = 8 + prof + getModifier(Number(char.abilities[spellAbility]) || 10)

  container.innerHTML = `
    <div class="screen screen--overview">

      <div class="overview__header panel">
        <div class="name-banner">
          <span class="name-banner__name">${char.meta.name}</span>
        </div>
        <div class="overview__meta">
          <span class="meta-tag">${char.meta.race}</span>
          <span class="meta-tag">${char.meta.class}${char.meta.subclass ? ' · ' + char.meta.subclass : ''}</span>
          <span class="meta-tag">Level ${char.meta.level}</span>
          <span class="meta-tag">${char.meta.background}</span>
        </div>
      </div>

      <div class="overview__combat panel">
        ${hpShield({ current: char.hp.current, max: char.hp.max, temp: char.hp.temp })}
        <div class="overview__stats">
          <div class="stat-badge" data-edit="ac" title="Click to edit" style="cursor:pointer">
            <span class="stat-badge__value">${ac}</span>
            <span class="stat-badge__label">AC</span>
          </div>
          ${statBadge({ label: 'Initiative', value: formatModifier(initMod) })}
          <div class="stat-badge" data-edit="speed" title="Click to edit" style="cursor:pointer">
            <span class="stat-badge__value">${speed}ft</span>
            <span class="stat-badge__label">Speed</span>
          </div>
          ${statBadge({ label: 'Prof',     value: '+' + prof })}
          ${statBadge({ label: 'Spell DC', value: spellDC })}
        </div>
      </div>

      <div class="panel">
        <div class="overview__abilities">
          ${ABILITY_KEYS.map(key => abilityOrb({
            label:    ABILITY_LABELS[key],
            score:    char.abilities[key],
            modifier: getModifier(char.abilities[key]),
          })).join('')}
        </div>
      </div>

      <div class="panel overview__saving-throws">
        <div class="divider"></div>
        <strong style="font-family:var(--s-font-ui);font-size:var(--s-font-size-xs);color:var(--s-color-text-muted);letter-spacing:.1em">SAVING THROWS</strong>
        <div style="display:flex;flex-wrap:wrap;gap:var(--s-gap-sm);margin-top:var(--s-gap-sm)">
          ${ABILITY_KEYS.map(key => {
            const bonus = getSavingThrow(char.abilities[key], char.savingThrows[key], char.meta.level)
            return `
              <div class="stat-badge" style="min-width:52px">
                <span class="stat-badge__value">${formatModifier(bonus)}</span>
                <span class="stat-badge__label">${ABILITY_LABELS[key]}</span>
              </div>
            `
          }).join('')}
        </div>
      </div>

      <div style="display:flex;gap:var(--s-gap-sm);justify-content:flex-end">
        <button class="btn" id="rest-btn">🌙 Rest</button>
        <button class="btn btn--accent" id="levelup-btn">⬆ Level Up</button>
      </div>

      ${char.hp.current <= 0 ? `
        <div class="panel">
          <strong style="font-family:var(--s-font-ui);font-size:var(--s-font-size-xs);color:var(--s-color-danger);letter-spacing:.1em">DEATH SAVES</strong>
          <div style="display:flex;gap:var(--s-gap-md);margin-top:var(--s-gap-sm)">
            <div>
              <div style="font-size:var(--s-font-size-xs);color:var(--s-color-success);font-family:var(--s-font-ui)">Successes</div>
              <div style="display:flex;gap:.3rem;margin-top:.25rem">
                ${Array.from({length:3},(_,i)=>`<span class="gem${i < char.deathSaves.successes ? ' gem--filled' : ''}" data-save-type="success" data-index="${i}"></span>`).join('')}
              </div>
            </div>
            <div>
              <div style="font-size:var(--s-font-size-xs);color:var(--s-color-danger);font-family:var(--s-font-ui)">Failures</div>
              <div style="display:flex;gap:.3rem;margin-top:.25rem">
                ${Array.from({length:3},(_,i)=>`<span class="gem${i < char.deathSaves.failures ? ' gem--filled' : ''}" style="${i < char.deathSaves.failures ? 'background-color:var(--s-color-danger);border-color:var(--s-color-danger)' : ''}" data-save-type="failure" data-index="${i}"></span>`).join('')}
              </div>
            </div>
          </div>
        </div>
      ` : ''}

    </div>
  `

  attach(container, char)
}

function attach(container, char) {
  container.querySelector('.hp-shield')?.addEventListener('click', () => {
    const input = prompt(`HP (current / max):`, `${char.hp.current} / ${char.hp.max}`)
    if (!input) return
    const [cur, max] = input.split('/').map(s => parseInt(s.trim(), 10))
    if (!isNaN(cur)) store.updateCharacterPath('hp.current', Math.min(cur, max ?? char.hp.max))
    if (!isNaN(max)) store.updateCharacterPath('hp.max', max)
    render(container)
  })

  container.querySelectorAll('.ability-orb').forEach(orb => {
    orb.addEventListener('click', () => {
      const key   = orb.dataset.ability
      const score = parseInt(prompt(`${key.toUpperCase()} score:`, char.abilities[key]), 10)
      if (!isNaN(score) && score >= 1 && score <= 30) {
        store.updateCharacterPath(`abilities.${key}`, score)
        render(container)
      }
    })
  })

  container.querySelector('[data-edit="ac"]')?.addEventListener('click', () => {
    const val = parseInt(prompt('Armor Class:', char.combat.ac), 10)
    if (!isNaN(val) && val >= 0) { store.updateCharacterPath('combat.ac', val); render(container) }
  })

  container.querySelector('[data-edit="speed"]')?.addEventListener('click', () => {
    const val = parseInt(prompt('Speed (ft):', char.combat.speed), 10)
    if (!isNaN(val) && val >= 0) { store.updateCharacterPath('combat.speed', val); render(container) }
  })

  container.querySelector('#rest-btn')?.addEventListener('click', openRest)
  container.querySelector('#levelup-btn')?.addEventListener('click', openLevelUp)

  container.querySelectorAll('[data-save-type]').forEach(gem => {
    gem.addEventListener('click', () => {
      const type  = gem.dataset.saveType   // 'success' | 'failure'
      const index = parseInt(gem.dataset.index, 10)
      const field = type === 'success' ? 'deathSaves.successes' : 'deathSaves.failures'
      const cur   = type === 'success' ? char.deathSaves.successes : char.deathSaves.failures
      store.updateCharacterPath(field, index < cur ? index : index + 1)
      render(container)
    })
  })
}
