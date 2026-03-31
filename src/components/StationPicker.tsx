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
  const [showOptionsContainer, setShowOptionsContainer] = useState(false)
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
        setShowOptionsContainer(false)
        setMode(null)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClose = () => {
    setOpen(false)
    setShowOptionsContainer(false)
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

  const openMode = (m: 'stop' | 'address') => {
    setShowOptionsContainer(false)
    setMode(m)
    setOpen(true)
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

      {/* Dropdown options — sous le champ, même largeur */}
      {showOptionsContainer && (
        <div className="absolute z-30 inset-x-0 top-full mt-1 bg-surface border border-surface-2 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={() => openMode('stop')}
            className="flex items-center gap-3 px-4 py-3 w-full text-left border-b border-surface-2 active:bg-surface-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="text-accent shrink-0">
              <path fill="currentColor" d="M9 14a1 1 0 1 0 0 2a1 1 0 1 0 0-2m6 0a1 1 0 1 0 0 2a1 1 0 1 0 0-2"/><path fill="currentColor" d="M16 6h-3V4h4V2H7v2h4v2H8C6.35 6 5 7.35 5 9v8c0 1.1.9 2 2 2h1l-2 3h2.25L9 21h6l.75 1H18l-2-3h1c1.1 0 2-.9 2-2V9c0-1.65-1.35-3-3-3M8 8h8c.55 0 1 .45 1 1v2H7V9c0-.55.45-1 1-1m-1 9v-4h10v4z"/>
            </svg>
            <span translate="no" className="text-sm font-medium text-texte">Station</span>
          </button>
          <button
            onClick={() => openMode('address')}
            className={`flex items-center gap-3 px-4 py-3 w-full text-left active:bg-surface-2 ${userCoords ? 'border-b border-surface-2' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <span translate="no" className="text-sm font-medium text-texte">Adresse</span>
          </button>
          {userCoords && (
            <button
              onClick={() => { setShowOptionsContainer(false); handleGps() }}
              className="flex items-center gap-3 px-4 py-3 w-full text-left active:bg-surface-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
                <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/><circle cx="12" cy="12" r="4"/>
              </svg>
              <span translate="no" className="text-sm font-medium text-accent">Ma position</span>
            </button>
          )}
        </div>
      )}

      {/* Champ déclencheur */}
      {!open ? (
        <button
          onClick={() => setShowOptionsContainer(true)}
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
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border-2 border-tam-blue rounded-lg">
            <button
              onClick={() => { setMode(null); setOpen(false); setShowOptionsContainer(true); setQuery('') }}
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
                    className="w-full text-left px-4 py-3 hover:bg-surface-2 border-b border-surface-2 last:border-0"
                  >
                    <span className="text-texte text-sm">{addr.label}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
