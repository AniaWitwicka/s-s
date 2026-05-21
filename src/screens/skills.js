import { store } from '../store.js'
import { skillRow } from '../components/skill-row.js'
import { SKILLS, getSkillBonus } from '../engine/skills.js'
import { getPassivePerception } from '../engine/abilities.js'
import { open as openRules } from '../modals/rules-lookup.js'

export function render(container) {
  const char = store.getActiveCharacter()
  if (!char) { container.innerHTML = '<p style="padding:1rem">No character.</p>'; return }

  const passivePerc = getPassivePerception(
    char.abilities.wis,
    char.skills.perception.proficient,
    char.meta.level
  )

  container.innerHTML = `
    <div class="screen screen--skills">

      <div class="panel" style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-family:var(--s-font-ui);font-size:var(--s-font-size-xs);color:var(--s-color-text-muted)">
          Passive Perception: <strong style="color:var(--s-color-accent)">${passivePerc}</strong>
        </span>
        <button class="btn" id="rules-btn" style="font-size:var(--s-font-size-xs);padding:.2rem .5rem">Rules ↑</button>
      </div>

      <div class="panel skills__list">
        <p style="font-size:var(--s-font-size-xs);color:var(--s-color-text-muted);margin-bottom:var(--s-gap-sm)">
          Tap to cycle: none → proficient → expertise
        </p>
        ${Object.entries(SKILLS).map(([id, { label, ability }]) =>
          skillRow({
            id, label, ability,
            bonus:      getSkillBonus(id, char),
            proficient: char.skills[id].proficient,
            expertise:  char.skills[id].expertise,
          })
        ).join('')}
      </div>

    </div>
  `

  attach(container, char)
}

function attach(container, char) {
  container.querySelector('#rules-btn')?.addEventListener('click', openRules)

  container.querySelectorAll('.skill-row').forEach(row => {
    row.addEventListener('click', () => {
      const id   = row.dataset.skill
      const { proficient, expertise } = char.skills[id]
      if (!proficient && !expertise) {
        store.updateCharacterPath(`skills.${id}.proficient`, true)
      } else if (proficient && !expertise) {
        store.updateCharacterPath(`skills.${id}.expertise`, true)
      } else {
        store.updateCharacterPath(`skills.${id}.proficient`, false)
        store.updateCharacterPath(`skills.${id}.expertise`,  false)
      }
      render(container)
    })
  })
}
