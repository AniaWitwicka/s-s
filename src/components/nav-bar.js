import { navigateTo, getCurrentScreen } from '../router.js'

const NAV_ITEMS = [
  { id: 'overview',   icon: '⚔️',  label: 'Overview'  },
  { id: 'skills',     icon: '🎲',  label: 'Skills'    },
  { id: 'inventory',  icon: '🎒',  label: 'Inventory' },
  { id: 'spellbook',  icon: '📖',  label: 'Spells'    },
  { id: 'feats',      icon: '⭐',  label: 'Feats'     },
  { id: 'journal',    icon: '📜',  label: 'Journal'   },
  { id: 'settings',   icon: '⚙️',  label: 'Settings'  },
]

export function renderNavBar(container) {
  const current = getCurrentScreen()
  container.innerHTML = `
    <nav class="nav-bar">
      ${NAV_ITEMS.map(({ id, icon, label }) => `
        <button
          class="nav-item${id === current ? ' nav-item--active' : ''}"
          data-screen="${id}"
          aria-label="${label}"
        >
          <span class="nav-item__icon">${icon}</span>
          <span>${label}</span>
        </button>
      `).join('')}
    </nav>
  `

  container.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.screen))
  })
}
