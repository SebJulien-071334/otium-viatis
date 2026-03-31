/**
 * check-realtime-coverage.mjs
 * Vérifie combien des 110 arrêts tram ont des données dans le CSV temps réel TAM.
 *
 * Usage : node scripts/check-realtime-coverage.mjs
 */

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const network = require('../src/data/network.json')

const TAM_CSV_URL =
  'https://data.montpellier3m.fr/sites/default/files/ressources/TAM_MMM_TpsReel.csv'

// ─── Matching identique à useRealtime.ts ──────────────────────────────────────

const ABBR = { st: 'saint', ste: 'sainte' }

function tokenize(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(t => ABBR[t] ?? t)
}

function tokenMatches(a, b) {
  if (a === b) return true
  const ac = a.endsWith('.') ? a.slice(0, -1) : a
  const bc = b.endsWith('.') ? b.slice(0, -1) : b
  return bc.startsWith(ac) || ac.startsWith(bc)
}

function stopMatches(csvName, stopName) {
  const csvTokens = tokenize(csvName)
  const stopTokens = tokenize(stopName)
  const shorter = csvTokens.length <= stopTokens.length ? csvTokens : stopTokens
  const longer  = csvTokens.length <= stopTokens.length ? stopTokens : csvTokens
  return shorter.every(t => longer.some(u => tokenMatches(t, u)))
}

// ─── Fetch + parse CSV ────────────────────────────────────────────────────────

async function fetchCSV() {
  console.log('Fetching CSV from TAM…')
  const res = await fetch(TAM_CSV_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

function parseCSV(text) {
  return text
    .split('\n')
    .slice(1)
    .filter(l => l.trim())
    .map(l => {
      const c = l.split(';')
      return {
        stopName: c[3]?.trim() ?? '',
        lineCode: c[4]?.trim() ?? '',
        headsign: c[5]?.trim() ?? '',
      }
    })
    .filter(r => r.stopName && r.lineCode)
}

// ─── Trouver le stop suivant dans chaque direction ────────────────────────────

function getNextStops(stop) {
  const results = []
  for (const line of network.network) {
    for (const dir of line.directions) {
      const idx = dir.stops.findIndex(s => s.id === stop.id)
      if (idx !== -1 && idx + 1 < dir.stops.length) {
        const next = dir.stops[idx + 1]
        if (!results.find(s => s.id === next.id)) {
          results.push({ ...next, lineCode: line.code, headsign: dir.headsign })
        }
      }
    }
  }
  return results
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const csvText = await fetchCSV()
const rows = parseCSV(csvText)

const csvStopNames = [...new Set(rows.map(r => r.stopName))]
console.log(`CSV : ${rows.length} passages, ${csvStopNames.length} arrêts uniques\n`)

const results = { ok: [], fallback: [], missing: [] }

// Index CSV par lineCode pour filtrer correctement tram vs bus
const rowsByLine = new Map()
for (const r of rows) {
  if (!rowsByLine.has(r.lineCode)) rowsByLine.set(r.lineCode, [])
  rowsByLine.get(r.lineCode).push(r)
}

function isStopInCSV(stopName, lineCodes) {
  for (const code of lineCodes) {
    const lineRows = rowsByLine.get(code) ?? []
    if (lineRows.some(r => stopMatches(r.stopName, stopName))) return true
  }
  return false
}

for (const stop of network.stops) {
  const inCSV = isStopInCSV(stop.name, stop.lines)

  if (inCSV) {
    results.ok.push(stop)
    continue
  }

  // Pas trouvé → tester les stops suivants (fallback secondStop)
  const nextStops = getNextStops(stop)
  const fallbackStop = nextStops.find(ns =>
    isStopInCSV(ns.name, stop.lines)
  )

  if (fallbackStop) {
    results.fallback.push({ stop, fallbackStop })
  } else {
    results.missing.push({ stop, nextStops })
  }
}

// ─── Rapport ─────────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════')
console.log(`  COUVERTURE TEMPS RÉEL — ${network.stops.length} arrêts tram`)
console.log('═══════════════════════════════════════════════════════')
console.log(`✅  Couvert directement    : ${results.ok.length}`)
console.log(`⚠️   Couvert via secondStop : ${results.fallback.length}`)
console.log(`❌  Aucune donnée          : ${results.missing.length}`)
console.log('')

if (results.fallback.length > 0) {
  console.log('─── ⚠️  Fallback secondStop ────────────────────────────')
  for (const { stop, fallbackStop } of results.fallback) {
    console.log(`  ${stop.name.padEnd(35)} → fallback: ${fallbackStop.name} (L${fallbackStop.lineCode})`)
  }
  console.log('')
}

if (results.missing.length > 0) {
  console.log('─── ❌  Sans données (ni stop suivant) ─────────────────')
  for (const { stop, nextStops } of results.missing) {
    const lines = stop.lines.map(l => `L${l}`).join(', ')
    const nextInfo = nextStops.length
      ? `  [suivants: ${nextStops.map(s => s.name).join(', ')}]`
      : '  [aucun stop suivant trouvé]'
    console.log(`  ${stop.name.padEnd(35)} (${lines})${nextInfo}`)
  }
  console.log('')
}

console.log('═══════════════════════════════════════════════════════')
