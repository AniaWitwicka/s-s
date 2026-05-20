import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createCharacter } from '../engine/character.js'
import { applyLevelUp as engineApplyLevelUp } from '../engine/leveling.js'

const deepMerge = (target, patch) => {
  const result = { ...target }
  for (const key of Object.keys(patch)) {
    if (patch[key] !== null && typeof patch[key] === 'object' && !Array.isArray(patch[key])) {
      result[key] = deepMerge(target[key] || {}, patch[key])
    } else {
      result[key] = patch[key]
    }
  }
  return result
}

const updateChar = (characters, id, fn) =>
  characters.map(c => c.id === id ? fn(c) : c)

const touch = (char) => ({ ...char, meta: { ...char.meta, updatedAt: new Date().toISOString() } })

export const useCharacterStore = create(
  persist(
    (set, get) => ({
      characters: [],
      activeCharacterId: null,

      createCharacter: (overrides = {}) => {
        const char = createCharacter(overrides)
        set(s => ({ characters: [...s.characters, char], activeCharacterId: char.id }))
        return char.id
      },

      updateCharacter: (id, patch) => set(s => ({
        characters: updateChar(s.characters, id, c => touch(deepMerge(c, patch)))
      })),

      deleteCharacter: (id) => set(s => {
        const remaining = s.characters.filter(c => c.id !== id)
        const activeId = s.activeCharacterId === id
          ? (remaining[0]?.id ?? null)
          : s.activeCharacterId
        return { characters: remaining, activeCharacterId: activeId }
      }),

      setActive: (id) => set({ activeCharacterId: id }),

      updateHP: (id, current, temp) => set(s => ({
        characters: updateChar(s.characters, id, c => touch({
          ...c,
          hp: { ...c.hp, current: Math.min(current, c.hp.max), temp: temp ?? c.hp.temp }
        }))
      })),

      toggleProficiency: (id, skillId) => set(s => ({
        characters: updateChar(s.characters, id, c => {
          const skill = c.skills[skillId]
          const proficient = !skill.proficient
          const expertise = proficient ? skill.expertise : false
          return touch({ ...c, skills: { ...c.skills, [skillId]: { proficient, expertise } } })
        })
      })),

      toggleExpertise: (id, skillId) => set(s => ({
        characters: updateChar(s.characters, id, c => {
          const skill = c.skills[skillId]
          if (!skill.proficient) return c
          return touch({ ...c, skills: { ...c.skills, [skillId]: { ...skill, expertise: !skill.expertise } } })
        })
      })),

      useSpellSlot: (id, level) => set(s => ({
        characters: updateChar(s.characters, id, c => {
          const slot = c.spells.slots[level]
          if (!slot || slot.used >= slot.total) return c
          return touch({
            ...c,
            spells: {
              ...c.spells,
              slots: { ...c.spells.slots, [level]: { ...slot, used: slot.used + 1 } }
            }
          })
        })
      })),

      recoverSpellSlot: (id, level) => set(s => ({
        characters: updateChar(s.characters, id, c => {
          const slot = c.spells.slots[level]
          if (!slot || slot.used <= 0) return c
          return touch({
            ...c,
            spells: {
              ...c.spells,
              slots: { ...c.spells.slots, [level]: { ...slot, used: slot.used - 1 } }
            }
          })
        })
      })),

      recoverAllSpellSlots: (id) => set(s => ({
        characters: updateChar(s.characters, id, c => {
          const resetSlots = Object.fromEntries(
            Object.entries(c.spells.slots).map(([lvl, slot]) => [lvl, { ...slot, used: 0 }])
          )
          return touch({ ...c, spells: { ...c.spells, slots: resetSlots } })
        })
      })),

      applyLevelUp: (id, choices) => set(s => ({
        characters: updateChar(s.characters, id, c => engineApplyLevelUp(c, choices))
      })),

      addItem: (id, item) => set(s => ({
        characters: updateChar(s.characters, id, c => touch({
          ...c,
          inventory: { ...c.inventory, items: [...c.inventory.items, { id: crypto.randomUUID(), ...item }] }
        }))
      })),

      removeItem: (id, itemId) => set(s => ({
        characters: updateChar(s.characters, id, c => touch({
          ...c,
          inventory: { ...c.inventory, items: c.inventory.items.filter(i => i.id !== itemId) }
        }))
      })),

      toggleEquipped: (id, itemId) => set(s => ({
        characters: updateChar(s.characters, id, c => touch({
          ...c,
          inventory: {
            ...c.inventory,
            items: c.inventory.items.map(i => i.id === itemId ? { ...i, equipped: !i.equipped } : i)
          }
        }))
      })),

      shortRest: (id, hpGained) => set(s => ({
        characters: updateChar(s.characters, id, c => {
          const newCurrent = Math.min(c.hp.current + hpGained, c.hp.max)
          const diceUsed = Math.ceil(hpGained / 4) // rough estimate
          return touch({
            ...c,
            hp: {
              ...c.hp,
              current: newCurrent,
              hitDice: { ...c.hp.hitDice, remaining: Math.max(0, c.hp.hitDice.remaining - 1) }
            }
          })
        })
      })),

      longRest: (id) => set(s => ({
        characters: updateChar(s.characters, id, c => {
          const resetSlots = Object.fromEntries(
            Object.entries(c.spells.slots).map(([lvl, slot]) => [lvl, { ...slot, used: 0 }])
          )
          const maxDiceRecovery = Math.max(1, Math.floor(c.meta.level / 2))
          return touch({
            ...c,
            hp: {
              ...c.hp,
              current: c.hp.max,
              temp: 0,
              hitDice: {
                ...c.hp.hitDice,
                remaining: Math.min(c.hp.hitDice.total, c.hp.hitDice.remaining + maxDiceRecovery)
              }
            },
            deathSaves: { successes: 0, failures: 0 },
            spells: { ...c.spells, slots: resetSlots },
          })
        })
      })),

      importCharacter: (charData) => set(s => {
        const existing = s.characters.find(c => c.id === charData.id)
        if (existing) {
          return { characters: s.characters.map(c => c.id === charData.id ? charData : c) }
        }
        return { characters: [...s.characters, charData], activeCharacterId: charData.id }
      }),
    }),
    { name: 'scroll-and-soul-characters' }
  )
)

export const useActiveCharacter = () => {
  const { characters, activeCharacterId } = useCharacterStore()
  return characters.find(c => c.id === activeCharacterId) ?? null
}
