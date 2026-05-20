import { ABILITY_ABBREVS } from '../engine/abilities.js'
import { SKILLS, getSkillBonus } from '../engine/skills.js'
import './SkillRow.css'

export default function SkillRow({ skillId, character, onToggleProficiency, onToggleExpertise }) {
  const skill = SKILLS[skillId]
  const { proficient, expertise } = character.skills[skillId] || {}
  const bonus = getSkillBonus(skillId, character)
  const sign = bonus >= 0 ? '+' : ''

  return (
    <div className="skill-row">
      <button
        className={`gem${proficient ? ' gem-filled' : ''}`}
        onClick={() => onToggleProficiency(skillId)}
        aria-label={`Toggle proficiency: ${skill.label}`}
        title="Proficient"
      />
      <button
        className={`gem gem-sm${expertise ? ' gem-filled gem-expertise' : ''}`}
        onClick={() => onToggleExpertise(skillId)}
        aria-label={`Toggle expertise: ${skill.label}`}
        title="Expertise"
        disabled={!proficient}
      />
      <span className="skill-bonus">{sign}{bonus}</span>
      <span className="skill-name">{skill.label}</span>
      <span className="skill-ability">{ABILITY_ABBREVS[skill.ability]}</span>
    </div>
  )
}
