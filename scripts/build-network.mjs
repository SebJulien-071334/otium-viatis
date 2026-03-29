/**
 * Pré-traitement GTFS TAM → src/data/network.json
 * Usage : node scripts/build-network.mjs
 *
 * Lit les fichiers GTFS depuis ../Pwa-Otium_V/api/Tam/TAM_MMM_GTFS/
 * Génère src/data/network.json (réseau tram compact)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GTFS = join(__dirname, '../../Pwa-Otium_V/api/Tam/TAM_MMM_GTFS')
const OUT_DIR = join(__dirname, '../src/data')
const OUT_FILE = join(OUT_DIR, 'network.json')

function readCSV(file) {
  const text = readFileSync(join(GTFS, file), 'utf-8').replace(/^\uFEFF/, '')
  const lines = text.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
  return lines.slice(1).map(line => {
    // parser CSV simple gérant les champs entre guillemets
    const values = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { values.push(cur.trim()); cur = '' }
      else cur += ch
    }
    values.push(cur.trim())
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

// 1. Lignes de tram (route_type = 0)
const routes = readCSV('routes.txt').filter(r => r.route_type === '0')
console.log(`Lignes tram : ${routes.map(r => r.route_short_name).join(', ')}`)

// 2. Arrêts (stop_areas : location_type = 1)
const stopsAll = readCSV('stops.txt')
const stopMap = Object.fromEntries(
  stopsAll.map(s => [s.stop_id, s])
)
// stop_point → stop_area parent
const pointToArea = Object.fromEntries(
  stopsAll
    .filter(s => s.location_type !== '1' && s.parent_station)
    .map(s => [s.stop_id, s.parent_station])
)

// 3. Stop times → nombre d'arrêts par trip (pour choisir le plus long)
const trips = readCSV('trips.txt')
const routeTramIds = new Set(routes.map(r => r.route_id))
const stopTimes = readCSV('stop_times.txt')

// Comptage du nombre d'arrêts par trip
const tripStopCount = {}
const tripStopsRaw = {} // trip_id → [{stop_id, seq}]
for (const st of stopTimes) {
  if (!tripStopCount[st.trip_id]) { tripStopCount[st.trip_id] = 0; tripStopsRaw[st.trip_id] = [] }
  tripStopCount[st.trip_id]++
  tripStopsRaw[st.trip_id].push({ stop_id: st.stop_id, seq: Number(st.stop_sequence) })
}

// Trip représentatif = 1 par headsign distinct par route+direction (gère branches L3)
const repTrips = {} // "routeId-directionId-headsign" → trip_id
const repTripCount = {} // "routeId-directionId-headsign" → nb arrêts
const tripHeadsign = {} // trip_id → trip_headsign (vrai headsign GTFS pour matching CSV)
for (const t of trips) {
  if (!routeTramIds.has(t.route_id)) continue
  tripHeadsign[t.trip_id] = t.trip_headsign
  const key = `${t.route_id}-${t.direction_id}-${t.trip_headsign}`
  const count = tripStopCount[t.trip_id] ?? 0
  if (!repTrips[key] || count > (repTripCount[key] ?? 0)) {
    repTrips[key] = t.trip_id
    repTripCount[key] = count
  }
}
console.log(`Trips représentatifs : ${Object.keys(repTrips).length}`)

// 4. Stop times pour chaque trip représentatif
const neededTrips = new Set(Object.values(repTrips))
const tripStops = {}
for (const [tid, stops] of Object.entries(tripStopsRaw)) {
  if (!neededTrips.has(tid)) continue
  tripStops[tid] = stops
}
// Trier par séquence
for (const tid of Object.keys(tripStops)) {
  tripStops[tid].sort((a, b) => a.seq - b.seq)
}

// 5. Construire le réseau
const network = routes.map(route => {
  const directions = [0, 1].map(dir => {
    // Collecter tous les trips de cette route+direction (branches incluses)
    const keys = Object.keys(repTrips).filter(k => k.startsWith(`${route.route_id}-${dir}-`))
    if (keys.length === 0) return null

    // Merger les stops de toutes les branches (ordre du trip le plus long en premier)
    const keysSorted = keys.sort((a, b) => (repTripCount[b] ?? 0) - (repTripCount[a] ?? 0))
    const seenIds = new Set()
    const stops = []
    for (const key of keysSorted) {
      const tripId = repTrips[key]
      if (!tripStops[tripId]) continue
      for (const { stop_id } of tripStops[tripId]) {
        const areaId = pointToArea[stop_id] ?? stop_id
        if (seenIds.has(areaId)) continue
        const stop = stopMap[areaId] ?? stopMap[stop_id]
        if (!stop) continue
        seenIds.add(areaId)
        stops.push({
          id: stop.stop_id,
          code: stop.stop_code,
          name: stop.stop_name,
          lat: parseFloat(stop.stop_lat),
          lon: parseFloat(stop.stop_lon),
        })
      }
    }
    // Headsign = trip_headsign GTFS du trip principal (correspond exactement au CSV TAM)
    const mainTripId = repTrips[keysSorted[0]]
    const headsign = tripHeadsign[mainTripId] ?? ''
    return { direction: dir, headsign, stops }
  }).filter(Boolean)

  return {
    id: route.route_id,
    code: route.route_short_name,
    name: route.route_long_name,
    color: route.route_color ? `#${route.route_color}` : '#6b7280',
    textColor: route.route_text_color ? `#${route.route_text_color}` : '#ffffff',
    directions,
  }
})

// 6. Liste complète des stop_areas tram (pour autocomplete)
const tramStopIds = new Set()
network.forEach(r => r.directions.forEach(d => d.stops.forEach(s => tramStopIds.add(s.id))))
const tramStops = [...tramStopIds].map(id => {
  const s = stopMap[id]
  if (!s) return null
  // Trouver quelles lignes passent par cet arrêt
  const lines = network
    .filter(r => r.directions.some(d => d.stops.some(st => st.id === id)))
    .map(r => r.code)
  return {
    id: s.stop_id,
    code: s.stop_code,
    name: s.stop_name,
    lat: parseFloat(s.stop_lat),
    lon: parseFloat(s.stop_lon),
    lines,
  }
}).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name, 'fr'))

// 7. Transferts piétons inter-arrêts (transfers.txt)
const rawTransfers = readCSV('transfers.txt')
const footpathPairs = new Set()
const footpaths = []

for (const t of rawTransfers) {
  if (t.transfer_type !== '0') continue
  const fromParent = pointToArea[t.from_stop_id] ?? t.from_stop_id
  const toParent = pointToArea[t.to_stop_id] ?? t.to_stop_id
  if (fromParent === toParent) continue
  if (!tramStopIds.has(fromParent) || !tramStopIds.has(toParent)) continue
  const key = [fromParent, toParent].sort().join('|')
  if (!footpathPairs.has(key)) {
    footpathPairs.add(key)
    footpaths.push({ from: fromParent, to: toParent })
  }
}
console.log(`Transferts piétons tram : ${footpaths.length}`)

const output = { network, stops: tramStops, footpaths }
mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8')

console.log(`✅ network.json généré : ${network.length} lignes, ${tramStops.length} arrêts`)
console.log(`   → ${OUT_FILE}`)
