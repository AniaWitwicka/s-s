import { store } from '../store.js'
import { getSpellSlots, isSpellcaster } from '../engine/spells.js'

function close() {
  document.getElementById('modal-container').innerHTML = ''
}

function rerender() {
  import('../router.js').then(({ navigateTo, getCurrentScreen }) => {
    navigateTo(getCurrentScreen())
  })
}

export function open() {
  const container = document.getElementById('modal-container')
  container.innerHTML = `
    <div class="modal-overlay" id="rest-overlay">
      <div class="modal">
        <button class="modal__close" id="modal-close">×</button>
        <h2 class="modal__title">Take a Rest</h2>
        <div class="modal__body rest-options">

          <div class="rest-option">
            <span class="rest-option__title">Short Rest</span>
            <p class="rest-option__desc">Spend Hit Dice to recover HP. Abilities that recharge on a short rest are restored.</p>
            <button class="btn" id="short-rest">Short Rest</button>
          </div>

          <div class="divider"></div>

          <div class="rest-option">
            <span class="rest-option__title">Long Rest</span>
            <p class="rest-option__desc">Regain all HP, reset death saves, and restore all spell slots.</p>
            <button class="btn btn--accent" id="long-rest">Long Rest</button>
          </div>

        </div>
      </div>
    </div>
  `

  container.querySelector('#modal-close').addEventListener('click', close)
  container.querySelector('#rest-overlay').addEventListener('click', e => {
    if (e.target.id === 'rest-overlay') close()
  })

  container.querySelector('#short-rest').addEventListener('click', () => {
    // Short rest: nothing auto-restored at engine level yet (hit die rolling is manual)
    close()
  })

  container.querySelector('#long-rest').addEventListener('click', () => {
    const char = store.getActiveCharacter()
    if (!char) { close(); return }

    store.updateCharacterPath('hp.current', char.hp.max)
    store.updateCharacterPath('hp.temp', 0)
    store.updateCharacterPath('deathSaves', { successes: 0, failures: 0 })

    if (isSpellcaster(char.meta.class)) {
      const slots    = getSpellSlots(char.meta.class, char.meta.level)
      const updated  = { ...char.spellSlots }
      if (Array.isArray(slots)) {
        for (let i = 1; i <= 9; i++) {
          updated[i] = { max: slots[i] ?? 0, used: 0 }
        }
      }
      store.updateCharacterPath('spellSlots', updated)
    }

    close()
    rerender()
  })
}
