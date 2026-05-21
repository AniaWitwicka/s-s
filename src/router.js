import { render as renderOverview  } from './screens/overview.js'
import { render as renderSkills    } from './screens/skills.js'
import { render as renderInventory } from './screens/inventory.js'
import { render as renderSpellbook } from './screens/spellbook.js'
import { render as renderFeats     } from './screens/feats.js'
import { render as renderJournal   } from './screens/journal.js'
import { render as renderSettings  } from './screens/settings.js'

const SCREENS = {
  overview:  renderOverview,
  skills:    renderSkills,
  inventory: renderInventory,
  spellbook: renderSpellbook,
  feats:     renderFeats,
  journal:   renderJournal,
  settings:  renderSettings,
}

let currentScreen = 'overview'

export function navigateTo(screenId) {
  if (!SCREENS[screenId]) return
  currentScreen = screenId

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('nav-item--active', el.dataset.screen === screenId)
  })

  const container = document.getElementById('main-content')
  SCREENS[screenId](container)
}

export function getCurrentScreen() {
  return currentScreen
}
