import { useQuery } from '@tanstack/react-query'

export interface Departure {
  lineCode: string
  headsign: string
  departureTime: string  // HH:MM:SS
  waitMinutes: number
  isTheoretical: boolean
}

interface RawRow {
  stopName: string
  lineCode: string
  headsign: string
  departureTime: string
  isTheoretical: boolean
}

function parseRealtimeCSV(csv: string): RawRow[] {
  const lines = csv.split('\n').slice(1) // skip header
  return lines
    .filter(l => l.trim().length > 0)
    .map(l => {
      const c = l.split(';')
      return {
        stopName: c[3]?.trim() ?? '',
        lineCode: c[4]?.trim() ?? '',
        headsign: c[5]?.trim() ?? '',
        departureTime: c[7]?.trim() ?? '',
        isTheoretical: c[8]?.trim() === '1',
      }
    })
    .filter(r => r.stopName && r.lineCode && r.departureTime)
}

/**
 * Calcule le temps d'attente en minutes par rapport à l'heure actuelle.
 * Gère le passage minuit (ex: 23:58 → 00:02 = 4 min).
 */
function calcWaitMinutes(departureTime: string): number {
  const now = new Date()
  const parts = departureTime.split(':').map(Number)
  const h = parts[0] ?? 0
  const m = parts[1] ?? 0
  const s = parts[2] ?? 0
  const depMinutes = h * 60 + m + s / 60
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  let wait = depMinutes - nowMinutes
  if (wait < -720) wait += 1440
  return Math.round(wait)
}

const ABBR: Record<string, string> = { st: 'saint', ste: 'sainte' }

function tokenize(s: string): string[] {
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

function tokenMatches(a: string, b: string): boolean {
  if (a === b) return true
  // Gère abréviations avec point : "montp." → préfixe de "montpellier"
  const ac = a.endsWith('.') ? a.slice(0, -1) : a
  const bc = b.endsWith('.') ? b.slice(0, -1) : b
  return bc.startsWith(ac) || ac.startsWith(bc)
}

function stopMatches(csvName: string, stopName: string): boolean {
  const csvTokens = tokenize(csvName)
  const stopTokens = tokenize(stopName)
  const shorter = csvTokens.length <= stopTokens.length ? csvTokens : stopTokens
  const longer = csvTokens.length <= stopTokens.length ? stopTokens : csvTokens
  return shorter.every(t => longer.some(u => tokenMatches(t, u)))
}

function filterDepartures(rows: RawRow[], stopName: string, lineCode?: string, headsign?: string): Departure[] {
  return rows
    .filter(r => stopMatches(r.stopName, stopName))
    .filter(r => !lineCode || r.lineCode === lineCode)
    .filter(r => !headsign || stopMatches(r.headsign, headsign))
    .map(r => ({ ...r, waitMinutes: calcWaitMinutes(r.departureTime) }))
    .filter(r => r.waitMinutes >= 0 && r.waitMinutes < 120)
    .sort((a, b) => a.waitMinutes - b.waitMinutes)
    .slice(0, 3)
}

async function fetchDepartures(stopName: string, lineCode?: string, headsign?: string, altStopName?: string): Promise<Departure[]> {
  const res = await fetch('/api/realtime')
  if (!res.ok) throw new Error(`Realtime HTTP ${res.status}`)
  const text = await res.text()
  const rows = parseRealtimeCSV(text)

  const primary = filterDepartures(rows, stopName, lineCode, headsign)
  if (primary.length > 0 || !altStopName) return primary

  // Terminus absent du CSV → fallback sur le stop suivant (même ligne, même direction)
  return filterDepartures(rows, altStopName, lineCode, headsign)
}

export function useRealtime(stopName: string | null, lineCode?: string, headsign?: string, altStopName?: string, enabled = true) {
  return useQuery({
    queryKey: ['realtime', stopName, lineCode, headsign, altStopName],
    queryFn: () => fetchDepartures(stopName!, lineCode, headsign, altStopName),
    enabled: enabled && !!stopName,
    refetchInterval: 30_000,
    staleTime: 25_000,
    gcTime: 60_000,
  })
}
