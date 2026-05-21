import { store } from './store.js'
import { navigateTo } from './router.js'
import { renderNavBar } from './components/nav-bar.js'
import { restoreFromStorage } from './skin-loader.js'

restoreFromStorage()

// Seed a default character if none exist
if (store.getState().characters.length === 0) {
  store.addCharacter({ meta: { name: 'New Adventurer' } })
}

renderNavBar(document.getElementById('nav-bar'))
navigateTo('overview')
