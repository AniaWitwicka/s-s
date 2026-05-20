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
  const root = document.documentElement
  for (const [key, value] of Object.entries(variables)) {
    root.style.setProperty(key, value)
  }
}

function injectCSS(cssText, tagId = 'active-skin-css') {
  let tag = document.getElementById(tagId)
  if (!tag) {
    tag = document.createElement('style')
    tag.id = tagId
    document.head.appendChild(tag)
  }
  tag.textContent = cssText
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
