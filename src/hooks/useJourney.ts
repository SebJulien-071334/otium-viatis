import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { findAllCandidates, walkMinutes } from '../lib/itinerary'
import type { LocalJourney, TransferDetail } from '../lib/itinerary'
import type { JourneyRequest } from '../types/journey'

const SMART_GAIN_MIN = 5

function tokenize(s: string): string[] {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-']/g, ' ').trim().split(/\s+/)
}

function stopMatches(csvName: string, stopName: string): boolean {
  const a = tokenize(csvName)
  const b = tokenize(stopName)
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a]
  return shorter.every(t => longer.includes(t))
}

interface CSVRow { stopName: string; lineCode: string; departureMin: number }

function parseCSV(csv: string): CSVRow[] {
  return csv.split('\n').slice(1).filter(l => l.trim()).map(l => {
    const c = l.split(';')
    const t = (c[7]?.trim() ?? '').split(':').map(Number)
    return {
      stopName: c[3]?.trim() ?? '',
      lineCode: c[4]?.trim() ?? '',
      departureMin: (t[0] ?? 0) * 60 + (t[1] ?? 0) + (t[2] ?? 0) / 60,
    }
  }).filter(r => r.stopName && r.lineCode)
}

function nextWaitMin(rows: CSVRow[], stopName: string, lineCode: string, afterMin: number): number | null {
  const waits = rows
    .filter(r => r.lineCode === lineCode && stopMatches(r.stopName, stopName))
    .map(r => { let w = r.departureMin - afterMin; if (w < -720) w += 1440; return w })
    .filter(w => w >= 0 && w < 90)
    .sort((a, b) => a - b)
  return waits[0] ?? null
}

interface ScoredCandidate {
  score: number
  transferDetails: TransferDetail[]
}

function scoreCandidate(c: LocalJourney, rows: CSVRow[], nowMin: number): ScoredCandidate {
  if (c.transfers === 0) return { score: c.totalDuration, transferDetails: [] }
  const seg1 = c.segments[0]
  const seg2 = c.segments[1]
  const realWalk = c.transferStopIds[0] !== c.transferStopIds[1]
    ? walkMinutes(seg1.toStop, seg2.fromStop)
    : 0
  const arrivalReady = nowMin + seg1.durationMin + realWalk
  const realWait = nextWaitMin(rows, seg2.fromStop.name, seg2.lineCode, arrivalReady)
  if (realWait === null) return { score: c.totalDuration, transferDetails: [{ walkMin: realWalk, waitMin: 3 }] }
  return {
    score: seg1.durationMin + realWalk + realWait + seg2.durationMin,
    transferDetails: [{ walkMin: realWalk, waitMin: Math.round(realWait) }],
  }
}

export function useJourney(request: JourneyRequest | null): {
  journeys: LocalJourney[]
  isLoading: boolean
  error: string | null
} {
  const { data: csv, isLoading } = useQuery({
    queryKey: ['realtime'],
    queryFn: async () => {
      const r = await fetch('/api/realtime')
      if (!r.ok) throw new Error('CSV unavailable')
      return r.text()
    },
    staleTime: 25_000,
    gcTime: 60_000,
    retry: 1,
  })

  return useMemo(() => {
    if (!request) return { journeys: [], isLoading: false, error: null }

    const candidates = findAllCandidates(request.from, request.to)
    if (candidates.length === 0) {
      return { journeys: [], isLoading, error: 'Aucun trajet tram trouvé entre ces deux arrêts.' }
    }

    // Trajet direct ou CSV pas encore chargé → premier candidat (déjà trié par paretoSort)
    if (!csv || candidates[0].transfers === 0) {
      return { journeys: [candidates[0]], isLoading, error: null }
    }

    const rows = parseCSV(csv)
    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60

    const scored = candidates.map(c => ({ c, ...scoreCandidate(c, rows, nowMin) }))
    scored.sort((a, b) => a.score - b.score)

    const original = scoreCandidate(candidates[0], rows, nowMin)
    const smartBest = scored[0]

    // N'optimise que si gain réel ≥ 5 min
    const best = (original.score - smartBest.score >= SMART_GAIN_MIN)
      ? { ...smartBest.c, totalDuration: Math.round(smartBest.score), transferDetails: smartBest.transferDetails }
      : { ...candidates[0], transferDetails: original.transferDetails }

    return { journeys: [best], isLoading: false, error: null }
  }, [request?.from, request?.to, csv, isLoading])
}
