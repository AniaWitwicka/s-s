const BREAKPOINTS = { xs: 0, sm: 480, md: 768, lg: 1024, xl: 1440 }
const BP_ORDER    = ['xl', 'lg', 'md', 'sm', 'xs']

let resizeTimer = null

export async function loadSkin(skinId) {
  const basePath = `/skins/${skinId}`

  const res = await fetch(`${basePath}/skin.json`)
  if (!res.ok) throw new Error(`Skin "${skinId}" not found (${res.status})`)
  const skin = await res.json()

  _loadFonts(skin.fonts ?? [])
  _applyVariables(skin.variables ?? {})
  _applyResponsiveImages(skin.images ?? {}, basePath)
  _injectSkinCSS(basePath)

  localStorage.setItem('active-skin', skinId)
}

export function applyCustomCSS(css) {
  _getOrCreate('style', 'custom-skin-css').textContent = css
  localStorage.setItem('custom-css', css)
}

export function clearCustomCSS() {
  const el = document.getElementById('custom-skin-css')
  if (el) el.textContent = ''
  localStorage.removeItem('custom-css')
}

export function restoreFromStorage() {
  const skinId   = localStorage.getItem('active-skin')
  const customCSS = localStorage.getItem('custom-css')
  if (skinId)    loadSkin(skinId).catch(console.error)
  if (customCSS) applyCustomCSS(customCSS)
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function _loadFonts(fonts) {
  fonts.forEach(({ family, url }) => {
    if (document.querySelector(`link[data-skin-font="${family}"]`)) return
    const link = Object.assign(document.createElement('link'), {
      rel:  'stylesheet',
      href: url,
    })
    link.dataset.skinFont = family
    document.head.appendChild(link)
  })
}

function _applyVariables(variables) {
  const root = document.documentElement
  Object.entries(variables).forEach(([k, v]) => root.style.setProperty(k, v))
}

function _applyResponsiveImages(images, basePath) {
  // Remove any previous resize listener by storing it on the function itself
  if (_applyResponsiveImages._listener) {
    window.removeEventListener('resize', _applyResponsiveImages._listener)
  }

  function applyAll() {
    const width = window.innerWidth
    const root  = document.documentElement
    Object.entries(images).forEach(([key, config]) => {
      root.style.setProperty(`--s-img-${key}`, `url('${_resolve(config, basePath, width)}')`)
    })
  }

  function onResize() {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(applyAll, 150)
  }

  _applyResponsiveImages._listener = onResize
  window.addEventListener('resize', onResize)
  applyAll()
}

function _resolve(config, basePath, width) {
  if (typeof config === 'string') return `${basePath}/images/${config}`
  for (const bp of BP_ORDER) {
    if (width >= BREAKPOINTS[bp] && config[bp]) {
      return `${basePath}/images/${config[bp]}`
    }
  }
  const first = Object.keys(config)[0]
  return `${basePath}/images/${config[first]}`
}

function _injectSkinCSS(basePath) {
  const el = _getOrCreate('link', 'active-skin-css')
  el.rel  = 'stylesheet'
  el.href = `${basePath}/skin.css`
}

function _getOrCreate(tag, id) {
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement(tag)
    el.id = id
    document.head.appendChild(el)
  }
  return el
}
