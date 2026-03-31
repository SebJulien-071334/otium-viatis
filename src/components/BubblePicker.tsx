import { useState, useRef, useEffect } from 'react'
import { useStopSearch } from '../hooks/useStopSearch'
import { useAddressSearch } from '../hooks/useAddressSearch'
import { tramStops } from '../lib/itinerary'
import LineBadge from './LineBadge'

// ── Constants (exported for Home.tsx container sizing) ───────
export const BUBBLE_SIZE = 160
export const BUBBLE_PEEK = 100

// ── Geometry ─────────────────────────────────────────────────
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

// ── Fan config ────────────────────────────────────────────────
const FAN_3 = [-35, 0, 35]
const FAN_2 = [-22, 22]
const FAN_RADIUS = 168
const SUB_SIZE = 64

// ── Types ─────────────────────────────────────────────────────
type SearchMode = 'station' | 'address' | null

export interface PlaceValue {
  id: string
  name: string
  lines?: string[]
}

interface BubblePickerProps {
  role: 'depart' | 'arrivee'
  value: PlaceValue | null
  onChange: (place: PlaceValue) => void
  onAddressCoords?: (coords: { lat: number; lon: number } | null) => void
  userCoords?: { lat: number; lon: number } | null
  isBack: boolean
  onBringToFront: () => void
}

// ── Icons ─────────────────────────────────────────────────────
function TramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="text-accent">
      <path fill="currentColor" d="M9 14a1 1 0 1 0 0 2a1 1 0 1 0 0-2m6 0a1 1 0 1 0 0 2a1 1 0 1 0 0-2"/>
      <path fill="currentColor" d="M16 6h-3V4h4V2H7v2h4v2H8C6.35 6 5 7.35 5 9v8c0 1.1.9 2 2 2h1l-2 3h2.25L9 21h6l.75 1H18l-2-3h1c1.1 0 2-.9 2-2V9c0-1.65-1.35-3-3-3M8 8h8c.55 0 1 .45 1 1v2H7V9c0-.55.45-1 1-1m-1 9v-4h10v4z"/>
    </svg>
  )
}

function AddressIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="text-accent">
      <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  )
}

function GpsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

// ── Styles ────────────────────────────────────────────────────
const BUBBLE_BG = 'radial-gradient(circle at 48% 60%, #ffffff 0%, #e0eaf4 48%, #c2d2e2 100%)'
const SUB_BG = 'radial-gradient(circle at 50% 44%, #ffffff 0%, #EEF1F6 52%, #d3dae4 100%)'

const BUBBLE_SHADOW = [
  'inset 0 3px 8px rgba(255,255,255,0.78)',
  'inset 0 -4px 10px rgba(0,0,0,0.13)',
  '0 8px 24px rgba(0,0,0,0.18)',
  '0 2px 6px rgba(0,0,0,0.10)',
].join(', ')

const SUB_SHADOW = [
  'inset 0 2px 5px rgba(255,255,255,0.70)',
  'inset 0 -3px 7px rgba(0,0,0,0.10)',
  '0 4px 14px rgba(0,0,0,0.15)',
].join(', ')

// ── Component ─────────────────────────────────────────────────
export default function BubblePicker({
  role, value, onChange, onAddressCoords, userCoords, isBack, onBringToFront,
}: BubblePickerProps) {
  const [fanOpen, setFanOpen]       = useState(false)
  const [fanVisible, setFanVisible] = useState(false)
  const [searchMode, setSearchMode] = useState<SearchMode>(null)
  const [query, setQuery]           = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  const stopResults = useStopSearch(searchMode === 'station' ? query : '')
  const { addresses, isLoading: banLoading } = useAddressSearch(searchMode === 'address' ? query : '')

  // Close when swapped to back
  useEffect(() => {
    if (isBack) { setFanOpen(false); setSearchMode(null); setQuery('') }
  }, [isBack])

  // Fan in/out animation
  useEffect(() => {
    if (fanOpen) {
      const id = requestAnimationFrame(() => setFanVisible(true))
      return () => cancelAnimationFrame(id)
    }
    setFanVisible(false)
  }, [fanOpen])

  // Focus input
  useEffect(() => {
    if (searchMode !== null) {
      const id = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [searchMode])

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFanOpen(false); setSearchMode(null); setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Handlers ─────────────────────────────────────────────────
  const handleMainClick = () => {
    if (isBack) { onBringToFront(); return }
    setFanOpen(f => !f)
  }

  const handleSubClick = (mode: 'station' | 'address' | 'position') => {
    setFanOpen(false)
    if (mode === 'position') {
      if (!userCoords) return
      const nearest = findNearestStop(userCoords.lat, userCoords.lon)
      onAddressCoords?.({ lat: userCoords.lat, lon: userCoords.lon })
      onChange({ id: nearest.id, name: nearest.name })
      return
    }
    setSearchMode(mode)
  }

  const handleSelectStop = (stop: { id: string; name: string; lines?: string[] }) => {
    onAddressCoords?.(null)
    onChange(stop)
    setSearchMode(null); setQuery('')
  }

  const handleSelectAddress = (lat: number, lon: number) => {
    const nearest = findNearestStop(lat, lon)
    onAddressCoords?.({ lat, lon })
    onChange({ id: nearest.id, name: nearest.name })
    setSearchMode(null); setQuery('')
  }

  const handleClose = () => { setFanOpen(false); setSearchMode(null); setQuery('') }

  // ── Fan geometry ──────────────────────────────────────────────
  const angles  = role === 'depart' ? FAN_3 : FAN_2
  const subDefs = role === 'depart'
    ? [
        { mode: 'station'  as const, label: 'Station',  Icon: TramIcon    },
        { mode: 'address'  as const, label: 'Adresse',  Icon: AddressIcon },
        { mode: 'position' as const, label: 'Position', Icon: GpsIcon     },
      ]
    : [
        { mode: 'station' as const, label: 'Station', Icon: TramIcon    },
        { mode: 'address' as const, label: 'Adresse', Icon: AddressIcon },
      ]

  const fanPositions = angles.map(deg => {
    const rad = (deg * Math.PI) / 180
    return { dx: FAN_RADIUS * Math.cos(rad), dy: FAN_RADIUS * Math.sin(rad) }
  })

  const halfMain   = BUBBLE_SIZE / 2
  const halfSub    = SUB_SIZE / 2
  const lineLength = Math.max(FAN_RADIUS - halfMain - halfSub, 8)

  // ── Wrapper style (front vs back) ─────────────────────────────
  const wrapperStyle: React.CSSProperties = isBack
    ? {
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 5,
        transform: `translateY(${BUBBLE_PEEK}px) translateX(30px) scale(0.82) rotateY(-8deg)`,
        filter: 'brightness(0.5) blur(0.3px)',
        transition: 'transform 550ms ease-out, filter 550ms ease-out',
        paddingLeft: '20px',
      }
    : {
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 10,
        transform: 'translateY(-8px) scale(1)',
        filter: 'brightness(1)',
        transition: 'transform 550ms ease-out, filter 550ms ease-out',
        paddingLeft: '20px',
      }

  return (
    <div style={wrapperStyle} ref={containerRef}>

      {/* ── Fan layer ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', width: BUBBLE_SIZE, height: BUBBLE_SIZE, overflow: 'visible' }}>

        {/* Connector lines */}
        {fanOpen && fanPositions.map((pos, i) => {
          const angle  = Math.atan2(pos.dy, pos.dx) * 180 / Math.PI
          const rad    = Math.atan2(pos.dy, pos.dx)
          const startX = Math.cos(rad) * halfMain
          const startY = Math.sin(rad) * halfMain
          return (
            <div
              key={i}
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: `calc(50% + ${startY}px)`,
                left: `calc(50% + ${startX}px)`,
                width: lineLength,
                height: 1.5,
                background: 'linear-gradient(to right, rgba(0,112,192,0.38), rgba(0,112,192,0.08))',
                transformOrigin: '0 50%',
                transform: `translateY(-50%) rotate(${angle}deg)`,
                pointerEvents: 'none',
                zIndex: 15,
                borderRadius: 2,
                opacity: fanVisible ? 1 : 0,
                transition: `opacity 200ms ease ${i * 50}ms`,
              }}
            />
          )
        })}

        {/* Sub-bubbles */}
        {fanOpen && subDefs.map((sub, i) => {
          const pos = fanPositions[i]
          return (
            <button
              key={sub.mode}
              type="button"
              onClick={() => handleSubClick(sub.mode)}
              aria-label={sub.label}
              style={{
                position: 'absolute',
                left: `calc(50% + ${halfMain + pos.dx - halfSub}px)`,
                top: `calc(50% + ${pos.dy - halfSub}px)`,
                width: SUB_SIZE, height: SUB_SIZE,
                borderRadius: '50%',
                background: SUB_BG,
                boxShadow: SUB_SHADOW,
                border: 'none', outline: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 3,
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                zIndex: 20,
                opacity: fanVisible ? 1 : 0,
                transform: fanVisible ? 'scale(1)' : 'scale(0.3)',
                transition: `transform 260ms cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms, opacity 200ms ease ${i * 60}ms`,
              }}
            >
              <sub.Icon />
              <span style={{ fontSize: 9, fontWeight: 600, color: '#1A1F2E', lineHeight: 1, pointerEvents: 'none' }}>
                {sub.label}
              </span>
              {/* Sub highlight arc */}
              <span aria-hidden="true" style={{
                position: 'absolute', top: '10%', left: '18%', width: '64%', height: '34%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.62), rgba(255,255,255,0))',
                pointerEvents: 'none',
              }} />
            </button>
          )
        })}

        {/* Main bubble */}
        <button
          type="button"
          onClick={handleMainClick}
          aria-label={role === 'depart' ? 'Départ' : 'Arrivée'}
          style={{
            width: BUBBLE_SIZE, height: BUBBLE_SIZE,
            borderRadius: '50%',
            background: BUBBLE_BG,
            boxShadow: BUBBLE_SHADOW,
            border: 'none', outline: 'none',
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            zIndex: 10,
          }}
        >
          {/* Arc highlight faux-3D */}
          <span aria-hidden="true" style={{
            position: 'absolute', top: '8%', left: '14%', width: '72%', height: '38%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 50% 25%, rgba(255,255,255,0.88), rgba(255,255,255,0))',
            pointerEvents: 'none', zIndex: 1,
          }} />
          {/* Content */}
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 14px', width: '100%' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
              {role === 'depart' ? 'Départ' : 'Arrivée'}
            </div>
            {value ? (
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1A1F2E', lineHeight: 1.25, wordBreak: 'break-word' }}>
                {value.name}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Toucher</div>
            )}
          </div>
        </button>
      </div>

      {/* ── Search panel ─────────────────────────────────────── */}
      {searchMode !== null && (
        <div style={{
          position: 'absolute',
          top: BUBBLE_SIZE + 10,
          left: -8, right: -8,
          zIndex: 30,
        }}>
          <div className="flex items-center gap-2 px-3 py-2 bg-surface border-2 border-tam-blue rounded-lg shadow-lg">
            <button
              type="button"
              onClick={() => { setSearchMode(null); setQuery(''); setFanOpen(true) }}
              className="text-accent text-sm leading-none shrink-0"
            >←</button>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchMode === 'station' ? 'Nom de la station…' : 'Adresse…'}
              className="flex-1 text-sm outline-none text-texte bg-transparent placeholder:text-secondaire"
            />
            <button type="button" onClick={handleClose} className="text-secondaire text-lg leading-none">✕</button>
          </div>

          <div className="bg-surface border border-surface-2 rounded-lg mt-1 shadow-lg max-h-56 overflow-y-auto">
            {searchMode === 'station' && (
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
                    type="button"
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
            {searchMode === 'address' && (
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
                    type="button"
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
