import { describe, it, expect } from 'vitest'
import { findNearestStations, formatDistance } from '../../lib/smart-departure'
import type { Station } from '../../types/journey'

const STATIONS: Station[] = [
  { id: 's1', name: 'Place de la Comédie', lines: ['L1', 'L2'], coord: { lat: 43.608, lon: 3.879 } },
  { id: 's2', name: 'Corum',               lines: ['L1'],        coord: { lat: 43.614, lon: 3.882 } },
  { id: 's3', name: 'Mosson',              lines: ['L1'],        coord: { lat: 43.617, lon: 3.820 } },
  { id: 's4', name: 'Odysseum',            lines: ['L1'],        coord: { lat: 43.598, lon: 3.930 } },
]

describe('findNearestStations', () => {
  it('retourne la station la plus proche en premier', () => {
    // Position = exactement sur Comédie
    const result = findNearestStations(43.608, 3.879, STATIONS, 3)
    expect(result[0].id).toBe('s1')
    expect(result[0].distanceKm).toBeCloseTo(0, 1)
  })

  it('respecte la limite demandée', () => {
    expect(findNearestStations(43.608, 3.879, STATIONS, 2)).toHaveLength(2)
    expect(findNearestStations(43.608, 3.879, STATIONS, 4)).toHaveLength(4)
  })

  it('trie bien par distance croissante', () => {
    const result = findNearestStations(43.608, 3.879, STATIONS, 4)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].distanceKm).toBeLessThanOrEqual(result[i + 1].distanceKm)
    }
  })

  it('retourne un tableau vide si aucune station', () => {
    expect(findNearestStations(43.608, 3.879, [], 3)).toHaveLength(0)
  })
})

describe('formatDistance', () => {
  it('affiche en mètres sous 1 km', () => {
    expect(formatDistance(0.5)).toBe('500 m')
    expect(formatDistance(0.1)).toBe('100 m')
  })

  it('affiche en km à partir de 1 km', () => {
    expect(formatDistance(1.5)).toBe('1.5 km')
    expect(formatDistance(2.0)).toBe('2.0 km')
  })
})
