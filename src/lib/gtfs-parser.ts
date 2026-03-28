import type { Station } from '../types/journey'

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, '').trim().split('\n')
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0])
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

/**
 * Parse le fichier stops.txt du GTFS TAM statique.
 * location_type=1 → stop_area (nœud principal)
 * location_type=0 ou vide → stop_point (quai)
 * On conserve uniquement les stop_areas pour la sélection de stations.
 */
export function parseGtfsStops(stopsText: string): Station[] {
  const rows = parseCSV(stopsText)
  return rows
    .filter(r => r['location_type'] === '1')
    .map(r => ({
      id: r['stop_id'] ?? '',
      name: r['stop_name'] ?? '',
      lines: [],
      coord: {
        lat: parseFloat(r['stop_lat'] ?? ''),
        lon: parseFloat(r['stop_lon'] ?? ''),
      },
    }))
    .filter(s => s.id && s.name && !isNaN(s.coord.lat) && !isNaN(s.coord.lon))
}
