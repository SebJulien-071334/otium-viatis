import { describe, it, expect } from 'vitest'
import { parseGtfsStops } from '../../lib/gtfs-parser'

const MOCK_CSV = [
  'stop_id,stop_name,stop_lat,stop_lon,location_type,parent_station',
  'SA:001,Place de la Comédie,43.608,3.879,1,',
  'SP:001A,"Comédie, quai A",43.608,3.879,0,SA:001',
  'SA:002,Corum,43.614,3.882,1,',
  'SA:003,Station invalide,,bad_coord,1,',
].join('\n')

describe('parseGtfsStops', () => {
  it('ne retourne que les stop_areas (location_type=1)', () => {
    const stops = parseGtfsStops(MOCK_CSV)
    expect(stops.find(s => s.id === 'SP:001A')).toBeUndefined()
    expect(stops.find(s => s.id === 'SA:001')).toBeDefined()
  })

  it('parse correctement le nom et les coordonnées', () => {
    const stops = parseGtfsStops(MOCK_CSV)
    const comedie = stops.find(s => s.id === 'SA:001')
    expect(comedie?.name).toBe('Place de la Comédie')
    expect(comedie?.coord.lat).toBeCloseTo(43.608)
    expect(comedie?.coord.lon).toBeCloseTo(3.879)
  })

  it('filtre les coordonnées invalides', () => {
    const stops = parseGtfsStops(MOCK_CSV)
    expect(stops.find(s => s.id === 'SA:003')).toBeUndefined()
  })

  it('retourne un tableau vide pour un CSV vide', () => {
    expect(parseGtfsStops('')).toHaveLength(0)
    expect(parseGtfsStops('stop_id,stop_name\n')).toHaveLength(0)
  })
})
