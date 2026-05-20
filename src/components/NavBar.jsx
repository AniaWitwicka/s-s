import './NavBar.css'

const TABS = [
  { id: 'overview',  label: 'Overview',  icon: '⚔' },
  { id: 'skills',    label: 'Skills',    icon: '✦' },
  { id: 'inventory', label: 'Bag',       icon: '⊕' },
  { id: 'spellbook', label: 'Spells',    icon: '✶' },
  { id: 'feats',     label: 'Feats',     icon: '★' },
  { id: 'journal',   label: 'Journal',   icon: '✎' },
  { id: 'settings',  label: 'Settings',  icon: '⚙' },
]

export default function NavBar({ activeScreen, onNavigate, variant = 'bottom' }) {
  // variant: 'bottom' | 'rail' | 'sidebar'
  return (
    <nav className={`navbar navbar--${variant}`}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`navbar-tab${activeScreen === tab.id ? ' active' : ''}`}
          onClick={() => onNavigate(tab.id)}
          aria-label={tab.label}
        >
          <span className="navbar-icon">{tab.icon}</span>
          {variant !== 'rail' && <span className="navbar-label">{tab.label}</span>}
        </button>
      ))}
    </nav>
  )
}
