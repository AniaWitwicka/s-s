const BREAKPOINTS = { xs: 0, sm: 480, md: 768, lg: 1024, xl: 1440 }
const BP_ORDER    = ['xl', 'lg', 'md', 'sm', 'xs']

let resizeTimer = null

function expandToRawUrl(input) {
  input = input.trim().replace(/\/$/, '')  // strip trailing slash

  // Already a raw URL — leave it alone
  if (input.startsWith('https://raw.githubusercontent.com')) return input

  // GitHub blob URL pasted by mistake — convert to raw
  if (input.startsWith('https://github.com')) {
    return input
      .replace('https://github.com', 'https://raw.githubusercontent.com')
      .replace('/blob/', '/')
      .replace(/\/skin\.json$/, '')   // basePath handles appending /skin.json
  }

  // Some other full URL — leave alone, will fail gracefully
  if (input.startsWith('http')) return input

  // Local skin ID — no slashes
  if (!input.includes('/')) return input

  // GitHub shorthand: username/repo/branch/directory
  return `https://raw.githubusercontent.com/${input}`
}

export async function loadSkin(skinIdOrUrl) {
  skinIdOrUrl = expandToRawUrl(skinIdOrUrl)

  // Accepts either:
  //   - a local skin id:  'dark-starfield'  → /skins/dark-starfield/skin.json
  //   - a remote URL:     'https://raw.githubusercontent.com/.../skin.json'

  const isRemote = skinIdOrUrl.startsWith('http')
  const skinUrl  = isRemote
    ? skinIdOrUrl
    : `/skins/${skinIdOrUrl}/skin.json`
  const basePath = isRemote
    ? skinIdOrUrl.replace(/\/skin\.json$/, '')  // strip filename → base URL
    : `/skins/${skinIdOrUrl}`

  const res = await fetch(skinUrl)
  if (!res.ok) throw new Error(`Skin not found at "${skinUrl}" (${res.status})`)
  const skin = await res.json()

  _loadFonts(skin.fonts ?? [])
  _applyVariables(skin.variables ?? {})
  _applyResponsiveImages(skin.images ?? {}, basePath, isRemote)
  _injectSkinCSS(basePath, isRemote)

  localStorage.setItem('active-skin', skinIdOrUrl)
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
  const skinIdOrUrl = localStorage.getItem('active-skin')
  const customCSS   = localStorage.getItem('custom-css')
  if (skinIdOrUrl) loadSkin(skinIdOrUrl).catch(console.error)
  if (customCSS)   applyCustomCSS(customCSS)
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

function _applyResponsiveImages(images, basePath, isRemote) {
  if (_applyResponsiveImages._listener) {
    window.removeEventListener('resize', _applyResponsiveImages._listener)
  }

  function applyAll() {
    const width = window.innerWidth
    const root  = document.documentElement
    Object.entries(images).forEach(([key, config]) => {
      root.style.setProperty(
        `--s-img-${key}`,
        `url('${_resolve(config, basePath, width, isRemote)}')`
      )
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

function _resolve(config, basePath, width, isRemote) {
  // Remote skins: image values in skin.json are already full URLs
  // Local skins:  image values are filenames, prepend basePath/images/
  if (typeof config === 'string') {
    return isRemote ? config : `${basePath}/images/${config}`
  }
  for (const bp of BP_ORDER) {
    if (width >= BREAKPOINTS[bp] && config[bp]) {
      return isRemote ? config[bp] : `${basePath}/images/${config[bp]}`
    }
  }
  const first = Object.keys(config)[0]
  return isRemote ? config[first] : `${basePath}/images/${config[first]}`
}

function _injectSkinCSS(basePath, isRemote) {
  const el   = _getOrCreate('link', 'active-skin-css')
  el.rel     = 'stylesheet'
  // Remote skins: skin.css lives next to skin.json at basePath
  // Local skins:  same pattern
  el.href    = `${basePath}/skin.css`
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