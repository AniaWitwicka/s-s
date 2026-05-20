import { useState, useEffect } from 'react'
import { useCharacterStore, useActiveCharacter } from './store/characterStore.js'
import { useSkinStore } from './store/skinStore.js'
import { useBreakpoint } from './hooks/useBreakpoint.js'
import SkinLoader from './components/SkinLoader.jsx'
import NavBar from './components/NavBar.jsx'
import Overview from './screens/Overview.jsx'
import Skills from './screens/Skills.jsx'
import Inventory from './screens/Inventory.jsx'
import Spellbook from './screens/Spellbook.jsx'
import Feats from './screens/Feats.jsx'
import Journal from './screens/Journal.jsx'
import Settings from './screens/Settings.jsx'
import CharacterCreator from './modals/CharacterCreator.jsx'
import RestModal from './modals/RestModal.jsx'
import LevelUpWizard from './modals/LevelUpWizard.jsx'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('overview')
  const [modal, setModal] = useState(null)

  const character = useActiveCharacter()
  const { createCharacter, longRest, shortRest, applyLevelUp } = useCharacterStore()
  const { loadAllBuiltInSkins } = useSkinStore()
  const { isMd, isLg } = useBreakpoint()

  const navVariant = isLg ? 'sidebar' : isMd ? 'rail' : 'bottom'

  useEffect(() => {
    loadAllBuiltInSkins()
  }, [])

  const handleCreateCharacter = (overrides) => {
    createCharacter(overrides)
    setModal(null)
    setScreen('overview')
  }

  const handleRest = (type, hpGained) => {
    if (!character) return
    if (type === 'long') longRest(character.id)
    else shortRest(character.id, hpGained)
  }

  if (!character) {
    return (
      <>
        <SkinLoader />
        <div className="empty-state">
          <h1 className="app-title">Scroll &amp; Soul</h1>
          <p className="app-subtitle">D&amp;D 5e Character Sheet</p>
          <button className="create-first-btn" onClick={() => setModal('create')}>
            Create Your First Character
          </button>
          {modal === 'create' && (
            <CharacterCreator onClose={() => setModal(null)} onCreate={handleCreateCharacter} />
          )}
        </div>
      </>
    )
  }

  const screens = {
    overview: <Overview onOpenRest={(t) => setModal(`rest-${t}`)} onOpenLevelUp={() => setModal('levelup')} />,
    skills:   <Skills />,
    inventory:<Inventory />,
    spellbook:<Spellbook />,
    feats:    <Feats />,
    journal:  <Journal />,
    settings: <Settings onCreateCharacter={() => setModal('create')} />,
  }

  return (
    <>
      <SkinLoader />
      <div className={`app-layout app-layout--${navVariant}`}>
        <NavBar activeScreen={screen} onNavigate={setScreen} variant={navVariant} />
        <main className="app-content">
          {screens[screen]}
        </main>
      </div>

      {modal === 'create' && (
        <CharacterCreator onClose={() => setModal(null)} onCreate={handleCreateCharacter} />
      )}
      {(modal === 'rest-short' || modal === 'rest-long') && character && (
        <RestModal
          type={modal === 'rest-long' ? 'long' : 'short'}
          character={character}
          onRest={handleRest}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'levelup' && character && (
        <LevelUpWizard
          character={character}
          onApply={applyLevelUp}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
