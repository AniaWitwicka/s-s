import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const BUILT_IN_SKINS = ['default', 'parchment', 'minimal']

export const useSkinStore = create(
  persist(
    (set, get) => ({
      activeSkinId: 'default',
      installedSkins: [],
      customCSS: '',

      setSkin: (skinId) => set({ activeSkinId: skinId }),
      setCustomCSS: (css) => set({ customCSS: css }),

      loadSkinManifest: async (skinId) => {
        try {
          const res = await fetch(`/skins/${skinId}/skin.json`)
          const json = await res.json()
          set(s => ({
            installedSkins: s.installedSkins.find(sk => sk.id === skinId)
              ? s.installedSkins.map(sk => sk.id === skinId ? { ...json, id: skinId } : sk)
              : [...s.installedSkins, { ...json, id: skinId }]
          }))
          return json
        } catch {
          return null
        }
      },

      loadAllBuiltInSkins: async () => {
        const { loadSkinManifest } = get()
        await Promise.all(BUILT_IN_SKINS.map(id => loadSkinManifest(id)))
      },
    }),
    {
      name: 'scroll-and-soul-skin',
      partialize: (s) => ({ activeSkinId: s.activeSkinId, customCSS: s.customCSS }),
    }
  )
)
