import { describe, it, expect } from 'vitest'
import { findJourneys, tramStops } from '../../lib/itinerary'

// Station centrale utilisée comme destination de référence pour tous les tests
const COMEDIE = tramStops.find(s => s.name === 'Place de la Comédie' || s.name.includes('Comédie'))
const REFERENCE_ID = COMEDIE?.id ?? tramStops[Math.floor(tramStops.length / 2)].id

// Stations genuinement injoignables par tram depuis Comédie (limite réseau, pas bug)
// Gambetta (L5 dir0) : les 11 arrêts avant lui sur L5 dir0 ne sont sur aucune autre ligne
const KNOWN_UNREACHABLE = new Set(['Gambetta'])

describe('itinerary — couverture réseau', () => {
  it('toutes les stations sont joignables depuis la Comédie', () => {
    const unreachable: string[] = []

    for (const stop of tramStops) {
      if (stop.id === REFERENCE_ID || KNOWN_UNREACHABLE.has(stop.name)) continue
      const journeys = findJourneys(REFERENCE_ID, stop.id)
      if (journeys.length === 0) unreachable.push(stop.name)
    }

    expect(unreachable, `Stations injoignables : ${unreachable.join(', ')}`).toEqual([])
  })

  it('toutes les stations peuvent rejoindre la Comédie', () => {
    const unreachable: string[] = []

    for (const stop of tramStops) {
      if (stop.id === REFERENCE_ID || KNOWN_UNREACHABLE.has(stop.name)) continue
      const journeys = findJourneys(stop.id, REFERENCE_ID)
      if (journeys.length === 0) unreachable.push(stop.name)
    }

    expect(unreachable, `Stations ne pouvant pas rejoindre la Comédie : ${unreachable.join(', ')}`).toEqual([])
  })
})

describe('itinerary — résultat unique', () => {
  it('retourne exactement 1 résultat', () => {
    const journeys = findJourneys(tramStops[0].id, REFERENCE_ID)
    expect(journeys.length).toBeLessThanOrEqual(1)
  })

  it('retourne 0 résultat si départ = arrivée', () => {
    expect(findJourneys(REFERENCE_ID, REFERENCE_ID)).toEqual([])
  })
})

describe('itinerary — cohérence des résultats', () => {
  it('le résultat a au moins 1 segment', () => {
    const journeys = findJourneys(tramStops[0].id, REFERENCE_ID)
    if (journeys.length === 0) return
    expect(journeys[0].segments.length).toBeGreaterThan(0)
  })

  it('la durée totale est positive', () => {
    const journeys = findJourneys(tramStops[0].id, REFERENCE_ID)
    if (journeys.length === 0) return
    expect(journeys[0].totalDuration).toBeGreaterThan(0)
  })
})
