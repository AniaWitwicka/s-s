// Run with: node scripts/fetch-srd.js
// Populates src/engine/data/ with all SRD content from dnd5eapi.co

import fs from 'fs/promises'
import path from 'path'

const BASE = 'https://www.dnd5eapi.co/api'
const OUT  = path.resolve('./src/engine/data')

const ENDPOINTS = [
  'spells',
  'classes',
  'subclasses',
  'races',
  'subraces',
  'feats',
  'features',
  'traits',
  'skills',
  'ability-scores',
  'proficiencies',
  'equipment',
  'equipment-categories',
  'magic-items',
  'conditions',
  'damage-types',
  'rule-sections',
  'rules'
]

async function fetchAll(endpoint) {
  console.log(`Fetching ${endpoint}...`)

  const indexRes = await fetch(`${BASE}/${endpoint}`)
  if (!indexRes.ok) throw new Error(`HTTP ${indexRes.status}`)
  const index = await indexRes.json()

  if (!index.results) {
    // Some endpoints return data directly, not a results list
    return index
  }

  // Fetch every individual entry in parallel, with a small throttle to be polite
  const CHUNK = 20
  const results = []
  for (let i = 0; i < index.results.length; i += CHUNK) {
    const chunk = index.results.slice(i, i + CHUNK)
    const entries = await Promise.all(
      chunk.map(async ({ url }) => {
        const res = await fetch(`https://www.dnd5eapi.co${url}`)
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
        return res.json()
      })
    )
    results.push(...entries)
  }

  return results
}

async function run() {
  await fs.mkdir(OUT, { recursive: true })
  await fs.mkdir(path.join(OUT, 'extensions'), { recursive: true })

  let succeeded = 0
  let failed = 0

  for (const endpoint of ENDPOINTS) {
    try {
      const data = await fetchAll(endpoint)

      const tagged = Array.isArray(data)
        ? data.map(entry => ({ ...entry, _source: 'srd' }))
        : { ...data, _source: 'srd' }

      const filename = endpoint.replace(/-/g, '_') + '.json'
      await fs.writeFile(
        path.join(OUT, filename),
        JSON.stringify(tagged, null, 2)
      )

      const count = Array.isArray(tagged) ? tagged.length : 1
      console.log(`  ✓ ${filename} (${count} entries)`)
      succeeded++
    } catch (err) {
      console.error(`  ✗ Failed ${endpoint}:`, err.message)
      failed++
    }
  }

  console.log(`\nDone. ${succeeded} files saved to src/engine/data/ (${failed} failed)`)
}

run()
