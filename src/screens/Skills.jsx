import { useActiveCharacter, useCharacterStore } from '../store/characterStore.js'
import { getPassivePerception } from '../engine/abilities.js'
import SkillRow from '../components/SkillRow.jsx'
import { SKILLS } from '../engine/skills.js'
import './Skills.css'

export default function Skills() {
  const character = useActiveCharacter()
  const { toggleProficiency, toggleExpertise } = useCharacterStore()

  if (!character) return null

  const pp = getPassivePerception(
    character.abilities.wis,
    character.skills.perception?.proficient,
    character.meta.level
  )

  return (
    <div className="skills-screen">
      <div className="passive-bar panel">
        <span className="passive-label">Passive Perception</span>
        <span className="passive-value">{pp}</span>
      </div>

      <div className="skills-list panel">
        {Object.keys(SKILLS).map(skillId => (
          <SkillRow
            key={skillId}
            skillId={skillId}
            character={character}
            onToggleProficiency={id => toggleProficiency(character.id, id)}
            onToggleExpertise={id => toggleExpertise(character.id, id)}
          />
        ))}
      </div>
    </div>
  )
}
