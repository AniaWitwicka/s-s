import { store } from '../store.js'
import { getHitDie, getAverageHPGain } from '../engine/leveling.js'
import { getModifier } from '../engine/abilities.js'

function close() {
  document.getElementById('modal-container').innerHTML = ''
}

function rerender() {
  import('../router.js').then(({ navigateTo, getCurrentScreen }) => {
    navigateTo(getCurrentScreen())
  })
}

export function open() {
  const char = store.getActiveCharacter()
  if (!char) return
  if (char.meta.level >= 20) {
    alert('Already at maximum level (20)!')
    return
  }

  const newLevel  = char.meta.level + 1
  const hitDie    = getHitDie(char.meta.class)
  const avgGain   = getAverageHPGain(char.meta.class)
  const conMod    = getModifier(char.abilities.con)

  const container = document.getElementById('modal-container')
  container.innerHTML = `
    <div class="modal-overlay" id="levelup-overlay">
      <div class="modal">
        <button class="modal__close" id="modal-close">×</button>
        <h2 class="modal__title">Level Up!</h2>

        <p style="text-align:center;font-family:var(--s-font-ui);color:var(--s-color-accent);margin-bottom:var(--s-gap-sm)">
          ${char.meta.name} reaches Level ${newLevel}
        </p>

        <div class="modal__body">
          <div class="rest-option">
            <span class="rest-option__title">HP Increase (d${hitDie} + CON ${conMod >= 0 ? '+' : ''}${conMod})</span>
            <p class="rest-option__desc">Take the average or roll for your new HP.</p>
            <div class="level-up__hp-roll" style="margin-top:var(--s-gap-sm)">
              <button class="btn" id="take-avg">+${avgGain} (average)</button>
              <button class="btn" id="roll-die">Roll d${hitDie}</button>
            </div>
            <p id="hp-result" style="font-family:var(--s-font-ui);color:var(--s-color-accent);margin-top:var(--s-gap-sm);min-height:1.4em"></p>
          </div>
        </div>

        <div class="modal__footer">
          <button class="btn" id="cancel">Cancel</button>
          <button class="btn btn--accent" id="confirm" disabled>Confirm Level Up</button>
        </div>
      </div>
    </div>
  `

  let hpGain = null
  const confirmBtn = container.querySelector('#confirm')
  const resultEl   = container.querySelector('#hp-result')

  function setGain(gain) {
    hpGain = Math.max(1, gain)
    resultEl.textContent = `HP +${hpGain}`
    confirmBtn.disabled = false
  }

  container.querySelector('#take-avg').addEventListener('click', () => setGain(avgGain))
  container.querySelector('#roll-die').addEventListener('click', () => {
    const roll = Math.floor(Math.random() * hitDie) + 1
    setGain(roll + conMod)
  })

  const doClose = () => close()
  container.querySelector('#modal-close').addEventListener('click', doClose)
  container.querySelector('#cancel').addEventListener('click', doClose)
  container.querySelector('#levelup-overlay').addEventListener('click', e => {
    if (e.target.id === 'levelup-overlay') doClose()
  })

  confirmBtn.addEventListener('click', () => {
    if (hpGain === null) return
    store.updateCharacterPath('meta.level', newLevel)
    store.updateCharacterPath('hp.max',     char.hp.max + hpGain)
    store.updateCharacterPath('hp.current', Math.min(char.hp.current + hpGain, char.hp.max + hpGain))
    close()
    rerender()
  })
}
