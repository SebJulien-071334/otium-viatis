/**
 * Formate une date Navitia "20240325T143000" en "14:30"
 */
export function formatNavitiaTime(dt: string): string {
  if (!dt || dt.length < 13) return '--:--'
  return `${dt.slice(9, 11)}:${dt.slice(11, 13)}`
}

/**
 * Formate une durée en secondes en texte lisible
 */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}
