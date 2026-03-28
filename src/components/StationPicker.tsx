import { useState, useRef, useEffect } from 'react'
import { useStopSearch } from '../hooks/useStopSearch'
import { useAddressSearch } from '../hooks/useAddressSearch'
import { tramStops } from '../lib/itinerary'
import LineBadge from './LineBadge'

type SearchMode = 'stop' | 'address' | 'gps' | null

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

function findNearestStop(lat: number, lon: number) {
  return tramStops
    .map(s => ({ ...s, distanceKm: haversineKm(lat, lon, s.lat, s.lon) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0]
}

interface StationPickerProps {
  label: string
  value: { id: string; name: string; lines?: string[] } | null
  onChange: (place: { id: string; name: string; lines?: string[] }) => void
  onAddressCoords?: (coords: { lat: number; lon: number } | null) => void
  userCoords?: { lat: number; lon: number } | null
  iconRotated?: boolean
}

export default function StationPicker({ label, value, onChange, onAddressCoords, userCoords, iconRotated = false }: StationPickerProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<SearchMode>(null)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const stopResults = useStopSearch(mode === 'stop' ? query : '')
  const { addresses, isLoading: banLoading } = useAddressSearch(mode === 'address' ? query : '')

  useEffect(() => {
    if (open && mode !== null) inputRef.current?.focus()
  }, [open, mode])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setMode(null)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClose = () => {
    setOpen(false)
    setMode(null)
    setQuery('')
  }

  const handleSelectStop = (stop: { id: string; name: string; lines?: string[] }) => {
    onAddressCoords?.(null)
    onChange({ id: stop.id, name: stop.name, lines: stop.lines })
    handleClose()
  }

  const handleSelectAddress = (lat: number, lon: number) => {
    const nearest = findNearestStop(lat, lon)
    onAddressCoords?.({ lat, lon })
    onChange({ id: nearest.id, name: nearest.name })
    handleClose()
  }

  const handleGps = () => {
    if (!userCoords) return
    const nearest = findNearestStop(userCoords.lat, userCoords.lon)
    onAddressCoords?.({ lat: userCoords.lat, lon: userCoords.lon })
    onChange({ id: nearest.id, name: nearest.name })
    handleClose()
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5 mb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          className={`text-accent shrink-0 ${iconRotated ? 'rotate-180' : ''}`}
        >
          <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
            <path d="M19.353 6.5H16.49V9H6.404v6H16.49v2.5h2.864A9.99 9.99 0 0 1 11 22C5.477 22 1 17.523 1 12S5.477 2 11 2a9.99 9.99 0 0 1 8.353 4.5M17.989 16v-1zm0-8v1z"/>
            <path d="m18.99 8l4 4l-4 4h-1v-2.5h-10v-3h10V8z"/>
          </g>
        </svg>
        <p className="text-sm font-semibold text-texte">{label}</p>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left px-3 py-3 bg-surface-2 border border-surface-2 rounded-lg text-sm flex items-center justify-between"
        >
          {value ? (
            <>
              <span className="text-texte font-medium">{value.name}</span>
              {value.lines && value.lines.length > 0 && (
                <span className="flex items-center gap-1 ml-2 shrink-0">
                  {value.lines.map(l => <LineBadge key={l} code={`L${l}`} size="sm" />)}
                </span>
              )}
            </>
          ) : (
            <span className="text-secondaire">Sélectionner…</span>
          )}
        </button>
      ) : (
        <div>
          {/* Choix du mode */}
          {mode === null ? (
            <div className="bg-surface border-2 border-tam-blue rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-surface-2">
                <p translate="no" className="text-xs text-secondaire font-medium">Rechercher par…</p>
                <button onClick={handleClose} className="text-secondaire text-lg leading-none">✕</button>
              </div>
              <div className="flex">
                <button
                  onClick={() => setMode('stop')}
                  className="flex-1 py-4 flex flex-col items-center gap-2 hover:bg-surface-2 border-r border-surface-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" className="text-accent">
                    <path fill="currentColor" d="M9 14a1 1 0 1 0 0 2a1 1 0 1 0 0-2m6 0a1 1 0 1 0 0 2a1 1 0 1 0 0-2"/><path fill="currentColor" d="M16 6h-3V4h4V2H7v2h4v2H8C6.35 6 5 7.35 5 9v8c0 1.1.9 2 2 2h1l-2 3h2.25L9 21h6l.75 1H18l-2-3h1c1.1 0 2-.9 2-2V9c0-1.65-1.35-3-3-3M8 8h8c.55 0 1 .45 1 1v2H7V9c0-.55.45-1 1-1m-1 9v-4h10v4z"/>
                  </svg>
                  <span translate="no" className="text-sm font-medium text-texte">Station</span>
                </button>
                <button
                  onClick={() => setMode('address')}
                  className={`flex-1 py-4 flex flex-col items-center gap-2 hover:bg-surface-2 ${userCoords ? 'border-r border-surface-2' : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 100 100" className="text-accent">
                    <path fill="currentColor" fillRule="evenodd" d="M34.19 5a2.5 2.5 0 0 0-1.077.232L1.447 19.943A2.5 2.5 0 0 0 0 22.211V92.5a2.5 2.5 0 0 0 3.553 2.268l30.613-14.221l30.613 14.22a2.5 2.5 0 0 0 2.108 0l15.44-7.171l6.562 11.365a2.633 3.965 60 0 0 4.75.297a2.633 3.965 60 0 0 2.117-4.262l-6.21-10.756l9.007-4.183A2.5 2.5 0 0 0 100 77.789V7.5a2.5 2.5 0 0 0-3.553-2.268L65.834 19.453L35.221 5.233A2.5 2.5 0 0 0 34.189 5m1.456 5.943l28.676 13.323l-.006.892a24.6 24.6 0 0 0-11.558 3.293c-11.815 6.822-15.884 22.01-9.063 33.824c4.375 7.578 12.184 11.944 20.34 12.303l-.082 14.293L35.277 75.55zm-3 .02l-.37 64.95L5 88.581V23.807zM95 11.418v64.777l-7.963 3.7l-3.494-6.051a2.633 3.965 60 0 0-2.211-1.04l-1.684-2.913c10.124-7.339 13.321-21.318 6.936-32.377c-3.41-5.908-8.914-9.878-15.041-11.52a25 25 0 0 0-4.227-.744l.006-.975zM64.63 30.627a19.2 19.2 0 0 1 5.497.65a19.2 19.2 0 0 1 11.691 8.99a19.216 19.216 0 0 1-7.048 26.307a19.22 19.22 0 0 1-26.31-7.049a19.22 19.22 0 0 1 7.05-26.308a19.24 19.24 0 0 1 9.12-2.59M75.2 72.459l1.683 2.916a2.633 3.965 60 0 0-.207 2.434l3.14 5.439l-12.865 5.977l.084-14.7A24.6 24.6 0 0 0 75.2 72.46"/>
                  </svg>
                  <span translate="no" className="text-sm font-medium text-texte">Adresse</span>
                </button>
                {userCoords && (
                  <button
                    onClick={handleGps}
                    className="flex-1 py-4 flex flex-col items-center gap-2 hover:bg-surface-2"
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span translate="no" className="text-sm font-medium text-accent">Ma position</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 bg-surface border-2 border-tam-blue rounded-lg">
                <button
                  onClick={() => { setMode(null); setQuery('') }}
                  className="text-accent text-sm leading-none shrink-0"
                >
                  ←
                </button>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={mode === 'stop' ? 'Nom de la station…' : 'Adresse…'}
                  className="flex-1 text-sm outline-none text-texte bg-transparent placeholder:text-secondaire"
                />
                <button onClick={handleClose} className="text-secondaire text-lg leading-none">✕</button>
              </div>

              <div className="absolute z-20 w-full bg-surface border border-surface-2 rounded-lg mt-1 shadow-lg max-h-72 overflow-y-auto">
                {mode === 'stop' && (
                  <>
                    {query.length < 2 && (
                      <div className="px-4 py-3 text-secondaire text-sm">Tapez au moins 2 caractères</div>
                    )}
                    {query.length >= 2 && stopResults.length === 0 && (
                      <div className="px-4 py-3 text-secondaire text-sm">Aucune station trouvée</div>
                    )}
                    {stopResults.map(stop => (
                      <button
                        key={stop.id}
                        onClick={() => handleSelectStop(stop)}
                        className="w-full text-left px-4 py-3 hover:bg-surface-2 border-b border-surface-2 last:border-0 flex items-center justify-between"
                      >
                        <span className="text-texte text-sm flex-1">{stop.name}</span>
                        <span className="flex items-center gap-1 ml-2">
                          {stop.lines.map(l => <LineBadge key={l} code={`L${l}`} size="sm" />)}
                        </span>
                      </button>
                    ))}
                  </>
                )}

                {mode === 'address' && (
                  <>
                    {query.length < 3 && (
                      <div className="px-4 py-3 text-secondaire text-sm">Tapez au moins 3 caractères</div>
                    )}
                    {query.length >= 3 && banLoading && (
                      <div className="px-4 py-2 text-xs text-secondaire">Recherche…</div>
                    )}
                    {query.length >= 3 && !banLoading && addresses.length === 0 && (
                      <div className="px-4 py-3 text-secondaire text-sm">Aucune adresse trouvée</div>
                    )}
                    {addresses.map(addr => (
                      <button
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr.lat, addr.lon)}
                        className="w-full text-left px-4 py-3 hover:bg-surface-2 border-b border-surface-2 last:border-0 flex items-start gap-2"
                      >
                        <span className="text-secondaire text-xs mt-0.5 shrink-0">📍</span>
                        <span className="text-texte text-sm">{addr.label}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
