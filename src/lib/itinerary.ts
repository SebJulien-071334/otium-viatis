import networkData from '../data/network.json'

export interface NetworkStop {
  id: string
  code: string
  name: string
  lat: number
  lon: number
  lines: string[]
}

interface NetworkDirection {
  direction: number
  headsign: string
  stops: NetworkStop[]
}

interface NetworkLine {
  id: string
  code: string
  name: string
  color: string
  textColor: string
  directions: NetworkDirection[]
}

interface Footpath { from: string; to: string }

interface NetworkData {
  network: NetworkLine[]
  stops: NetworkStop[]
  footpaths: Footpath[]
}

const { network, stops, footpaths = [] } = networkData as NetworkData

// Index : stop_id → [stop_ids accessibles à pied via footpath]
const footpathMap = new Map<string, string[]>()
for (const fp of footpaths) {
  if (!footpathMap.has(fp.from)) footpathMap.set(fp.from, [])
  if (!footpathMap.has(fp.to)) footpathMap.set(fp.to, [])
  footpathMap.get(fp.from)!.push(fp.to)
  footpathMap.get(fp.to)!.push(fp.from)
}

// Index : stop_id → lignes qui le desservent
const stopLinesMap = new Map<string, Set<string>>()
for (const s of stops) {
  stopLinesMap.set(s.id, new Set(s.lines))
}

export interface LocalSegment {
  lineCode: string
  lineColor: string
  lineTextColor: string
  headsign: string
  fromStop: NetworkStop
  toStop: NetworkStop
  stopCount: number
  durationMin: number
}

export interface TransferDetail {
  walkMin: number
  waitMin: number
}

export interface LocalJourney {
  totalDuration: number
  transfers: number
  segments: LocalSegment[]
  transferStopIds: string[]
  transferDetails?: TransferDetail[]
}

// Stations hub : prioritaires pour les correspondances
const HUB_STOP_IDS = new Set([
  'S5431', // Corum (L1, L2, L4)
  'S5472', // Gare Saint-Roch (L1, L2)
  'S5917', // Gare Saint-Roch - République (L3, L4)
  'S5569', // Nouveau Saint-Roch (L2, L4)
  'S5426', // Comédie (L1, L2)
  'S5606', // Place de l'Europe (L1, L4)
  'S5563', // Mosson (L1, L3)
  'S5572', // Odysseum (L1, L5)
  'S5570', // Observatoire (L3, L4)
  'S5564', // Moularès - Hôtel de Ville (L1, L3)
])

function findInDirection(
  dir: NetworkDirection,
  fromId: string,
  toId: string
): { fromIdx: number; toIdx: number } | null {
  const fromIdx = dir.stops.findIndex(s => s.id === fromId)
  if (fromIdx === -1) return null
  // Cherche la destination APRÈS fromIdx (gère les lignes circulaires avec terminus en double)
  const toIdx = dir.stops.findIndex((s, i) => i > fromIdx && s.id === toId)
  if (toIdx !== -1) return { fromIdx, toIdx }
  return null
}

function makeSegment(
  line: NetworkLine,
  dir: NetworkDirection,
  fromIdx: number,
  toIdx: number
): LocalSegment {
  const stopCount = toIdx - fromIdx
  return {
    lineCode: line.code,
    lineColor: line.color,
    lineTextColor: line.textColor,
    headsign: dir.headsign,
    fromStop: dir.stops[fromIdx],
    toStop: dir.stops[toIdx],
    stopCount,
    durationMin: stopCount * 2,
  }
}

export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 5 km/h = 83.3 m/min · ×1.3 tortuosité urbaine
export function walkMinutes(a: NetworkStop, b: NetworkStop): number {
  return Math.ceil(haversineMeters(a.lat, a.lon, b.lat, b.lon) * 1.3 / 83.3)
}

const TRANSFER_THRESHOLD_MIN = 5

function hubScore(j: LocalJourney): number {
  return j.transferStopIds.filter(id => HUB_STOP_IDS.has(id)).length
}

function paretoSort(a: LocalJourney, b: LocalJourney): number {
  if (Math.abs(a.totalDuration - b.totalDuration) <= TRANSFER_THRESHOLD_MIN) {
    const transferDiff = a.transfers - b.transfers
    if (transferDiff !== 0) return transferDiff
    const hubDiff = hubScore(b) - hubScore(a)
    if (hubDiff !== 0) return hubDiff
  }
  return a.totalDuration - b.totalDuration
}

export function findJourneys(fromId: string, toId: string): LocalJourney[] {
  if (fromId === toId) return []
  const results: LocalJourney[] = []

  // Trajets directs
  for (const line of network) {
    for (const dir of line.directions) {
      const pos = findInDirection(dir, fromId, toId)
      if (pos) {
        results.push({
          totalDuration: (pos.toIdx - pos.fromIdx) * 2,
          transfers: 0,
          segments: [makeSegment(line, dir, pos.fromIdx, pos.toIdx)],
          transferStopIds: [],
        })
      }
    }
  }

  if (results.length > 0) {
    return results.sort(paretoSort).slice(0, 1)
  }

  // Trajets avec 1 correspondance
  const fromLines = stopLinesMap.get(fromId) ?? new Set()

  for (const fromCode of fromLines) {
    const fromLine = network.find(l => l.code === fromCode)
    if (!fromLine) continue

    for (const dir1 of fromLine.directions) {
      const fromIdx = dir1.stops.findIndex(s => s.id === fromId)
      if (fromIdx === -1) continue

      for (let i = fromIdx + 1; i < dir1.stops.length; i++) {
        const transfer = dir1.stops[i]
        const candidates = [
          { id: transfer.id, footpathMin: 0 },
          ...(footpathMap.get(transfer.id) ?? []).map(id => ({ id, footpathMin: 2 })),
        ]

        for (const { id: candidateId, footpathMin } of candidates) {
          const transferLines = stopLinesMap.get(candidateId) ?? new Set()

          for (const toCode of transferLines) {
            if (toCode === fromCode && footpathMin === 0) continue
            const toLi = network.find(l => l.code === toCode)
            if (!toLi) continue

            for (const dir2 of toLi.directions) {
              const pos2 = findInDirection(dir2, candidateId, toId)
              if (pos2) {
                const seg1 = makeSegment(fromLine, dir1, fromIdx, i)
                const seg2 = makeSegment(toLi, dir2, pos2.fromIdx, pos2.toIdx)
                results.push({
                  totalDuration: seg1.durationMin + seg2.durationMin + 3 + footpathMin,
                  transfers: 1,
                  segments: [seg1, seg2],
                  transferStopIds: [transfer.id, candidateId],
                })
              }
            }
          }
        }
      }
    }
  }

  if (results.length > 0) {
    return results.sort(paretoSort).slice(0, 1)
  }

  // Trajets avec 2 correspondances
  for (const fromCode of fromLines) {
    const fromLine = network.find(l => l.code === fromCode)
    if (!fromLine) continue

    for (const dir1 of fromLine.directions) {
      const fromIdx = dir1.stops.findIndex(s => s.id === fromId)
      if (fromIdx === -1) continue

      for (let i = fromIdx + 1; i < dir1.stops.length; i++) {
        const transfer1 = dir1.stops[i]
        const transfer1Lines = stopLinesMap.get(transfer1.id) ?? new Set()

        for (const midCode of transfer1Lines) {
          if (midCode === fromCode) continue
          const midLine = network.find(l => l.code === midCode)
          if (!midLine) continue

          for (const dir2 of midLine.directions) {
            const midIdx = dir2.stops.findIndex(s => s.id === transfer1.id)
            if (midIdx === -1) continue

            for (let j = midIdx + 1; j < dir2.stops.length; j++) {
              const transfer2 = dir2.stops[j]
              const transfer2Lines = stopLinesMap.get(transfer2.id) ?? new Set()

              for (const toCode of transfer2Lines) {
                if (toCode === midCode || toCode === fromCode) continue
                const toLi = network.find(l => l.code === toCode)
                if (!toLi) continue

                for (const dir3 of toLi.directions) {
                  const pos3 = findInDirection(dir3, transfer2.id, toId)
                  if (pos3) {
                    const seg1 = makeSegment(fromLine, dir1, fromIdx, i)
                    const seg2 = makeSegment(midLine, dir2, midIdx, j)
                    const seg3 = makeSegment(toLi, dir3, pos3.fromIdx, pos3.toIdx)
                    results.push({
                      totalDuration: seg1.durationMin + seg2.durationMin + seg3.durationMin + 6,
                      transfers: 2,
                      segments: [seg1, seg2, seg3],
                      transferStopIds: [transfer1.id, transfer2.id],
                    })
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return results.sort(paretoSort).slice(0, 1)
}

// Retourne TOUS les candidats (sans slice) pour scoring temps réel
export function findAllCandidates(fromId: string, toId: string): LocalJourney[] {
  if (fromId === toId) return []
  const results: LocalJourney[] = []

  for (const line of network) {
    for (const dir of line.directions) {
      const pos = findInDirection(dir, fromId, toId)
      if (pos) {
        results.push({
          totalDuration: (pos.toIdx - pos.fromIdx) * 2,
          transfers: 0,
          segments: [makeSegment(line, dir, pos.fromIdx, pos.toIdx)],
          transferStopIds: [],
        })
      }
    }
  }

  if (results.length > 0) return results.sort(paretoSort)

  const fromLines = stopLinesMap.get(fromId) ?? new Set()

  for (const fromCode of fromLines) {
    const fromLine = network.find(l => l.code === fromCode)
    if (!fromLine) continue
    for (const dir1 of fromLine.directions) {
      const fromIdx = dir1.stops.findIndex(s => s.id === fromId)
      if (fromIdx === -1) continue
      for (let i = fromIdx + 1; i < dir1.stops.length; i++) {
        const transfer = dir1.stops[i]
        const candidates = [
          { id: transfer.id, footpathMin: 0 },
          ...(footpathMap.get(transfer.id) ?? []).map(id => ({ id, footpathMin: 2 })),
        ]
        for (const { id: candidateId, footpathMin } of candidates) {
          const transferLines = stopLinesMap.get(candidateId) ?? new Set()
          for (const toCode of transferLines) {
            if (toCode === fromCode && footpathMin === 0) continue
            const toLi = network.find(l => l.code === toCode)
            if (!toLi) continue
            for (const dir2 of toLi.directions) {
              const pos2 = findInDirection(dir2, candidateId, toId)
              if (pos2) {
                const seg1 = makeSegment(fromLine, dir1, fromIdx, i)
                const seg2 = makeSegment(toLi, dir2, pos2.fromIdx, pos2.toIdx)
                results.push({
                  totalDuration: seg1.durationMin + seg2.durationMin + 3 + footpathMin,
                  transfers: 1,
                  segments: [seg1, seg2],
                  transferStopIds: [transfer.id, candidateId],
                })
              }
            }
          }
        }
      }
    }
  }

  if (results.length > 0) return results.sort(paretoSort)

  // 2 correspondances — retourne le meilleur seulement (cas rare, pas d'optimisation temps réel)
  return findJourneys(fromId, toId)
}

export { stops as tramStops, network as tramNetwork }
