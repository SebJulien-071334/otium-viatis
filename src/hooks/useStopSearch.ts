import { useMemo } from 'react'
import { tramStops } from '../lib/itinerary'
import type { NetworkStop } from '../lib/itinerary'

const ABBREVIATIONS: Record<string, string> = {
  'st': 'saint',
  'ste': 'sainte',
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime accents
    .replace(/[-']/g, ' ')           // tirets et apostrophes → espace
    .replace(/\s+/g, ' ')            // espaces multiples → un seul
    .trim()
}

function expand(s: string): string {
  return normalize(s)
    .split(' ')
    .map(word => ABBREVIATIONS[word] ?? word)
    .join(' ')
}

export function useStopSearch(query: string): NetworkStop[] {
  return useMemo(() => {
    if (query.length < 2) return []
    const q = expand(query)
    return tramStops
      .filter(s => expand(s.name).includes(q))
      .slice(0, 8)
  }, [query])
}
