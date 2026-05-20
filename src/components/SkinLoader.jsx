import { useEffect, useRef } from 'react'
import { useSkinStore } from '../store/skinStore.js'

function injectFont(family, url) {
  const id = `skin-font-${family.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = url
  document.head.appendChild(link)
}

function applyVariables(variables) {
  const css = ':root {\n' + Object.entries(variables).map(([k, v]) => `  ${k}: ${v};`).join('\n') + '\n}'
  injectCSS(css, 'active-skin-vars')
}

function injectCSS(cssText, tagId = 'active-skin-css') {
  let tag = document.getElementById(tagId)
  if (!tag) {
    tag = document.createElement('style')
    tag.id = tagId
  }
  tag.textContent = cssText
  // Always keep custom-skin-css last so it wins the cascade
  if (tagId === 'custom-skin-css') {
    document.head.appendChild(tag)
  } else if (!tag.parentNode) {
    const customTag = document.getElementById('custom-skin-css')
    if (customTag) document.head.insertBefore(tag, customTag)
    else document.head.appendChild(tag)
  }
}

async function loadAndApplySkin(skinId) {
  try {
    const jsonRes = await fetch(`/skins/${skinId}/skin.json`)
    if (!jsonRes.ok) return

    const manifest = await jsonRes.json()

    if (manifest.fonts) {
      manifest.fonts.forEach(f => injectFont(f.family, f.url))
    }

    if (manifest.variables) {
      applyVariables(manifest.variables)
    }

    try {
      const cssRes = await fetch(`/skins/${skinId}/skin.css`)
      if (cssRes.ok) {
        const cssText = await cssRes.text()
        injectCSS(cssText)
      } else {
        injectCSS('')
      }
    } catch {
      injectCSS('')
    }
  } catch (err) {
    console.warn(`Failed to load skin "${skinId}":`, err)
  }
}

export default function SkinLoader() {
  const { activeSkinId, customCSS } = useSkinStore()
  const prevSkinId = useRef(null)

  useEffect(() => {
    if (prevSkinId.current !== activeSkinId) {
      prevSkinId.current = activeSkinId
      loadAndApplySkin(activeSkinId)
    }
  }, [activeSkinId])

  useEffect(() => {
    injectCSS(customCSS || '', 'custom-skin-css')
  }, [customCSS])

  return null
}
