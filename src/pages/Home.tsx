import { useState, useEffect } from 'react'
import StationPicker from '../components/StationPicker'
import { useFavorites } from '../hooks/useFavorites'
import type { JourneyRequest } from '../types/journey'

interface HomeProps {
  onSearch: (request: JourneyRequest) => void
  geoEnabled: boolean
  onGeoToggle: () => void
  geoError: string | null
  userCoords: { lat: number; lon: number } | null
}

const PEEK = 128  // px du haut de la carte arrière visible
const CARD_H = 120 // hauteur estimée d'une carte (ajuster si besoin)

export default function Home({ onSearch, geoEnabled, onGeoToggle, geoError, userCoords }: HomeProps) {
  const [from, setFrom] = useState<{ id: string; name: string; lines?: string[] } | null>(null)
  const [to, setTo] = useState<{ id: string; name: string; lines?: string[] } | null>(null)
  const [fromCoords, setFromCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [swapped, setSwapped] = useState(false)
  useEffect(() => { setSwapped(false) }, [from])
  const favorites = useFavorites(s => s.favorites)
  const removeFavorite = useFavorites(s => s.remove)

  const canSearch = !!from && !!to
  const fromFilled = !!from

  const frontStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    transform: `translateY(-8px) scale(1)`,
    filter: 'brightness(1)',
    transition: 'transform 550ms ease-out, filter 550ms ease-out',
  }

  const backStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    transform: `translateY(${PEEK}px) translateX(30px) scale(0.82) rotateY(-8deg)`,
    filter: 'brightness(0.45) blur(0.4px)',
    transition: 'transform 550ms ease-out, filter 550ms ease-out',
  }

  const departIsBack = swapped ? !fromFilled : fromFilled
  const departStyle = departIsBack ? backStyle : frontStyle
  const arriveeStyle = departIsBack ? frontStyle : backStyle

  return (
    <div className="min-h-screen bg-fond flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-3 sm:px-4 py-4 sm:py-5" style={{ paddingTop: 'max(1rem, calc(0.5rem + env(safe-area-inset-top)))' }}>
        {geoError && (
          <div className="bg-surface border border-retard/30 rounded-lg px-4 py-2">
            <p className="text-xs text-retard">{geoError}</p>
          </div>
        )}

        {/* Card stack */}
        <div>
          <style>{`
            @keyframes card-pulse {
              0%, 100% {
                box-shadow:
                  0 0 6px rgba(0,112,192,0.20),
                  0 0 14px rgba(0,112,192,0.10);
              }
              50% {
                box-shadow:
                  0 0 14px rgba(0,112,192,0.72),
                  0 0 32px rgba(0,112,192,0.45),
                  0 0 58px rgba(0,112,192,0.22);
              }
            }
            .card-glow {
              animation: card-pulse 2400ms ease-in-out infinite;
            }
          `}</style>

          <div className="relative" style={{ height: `${PEEK + CARD_H}px`, perspective: '1200px' }}>
            {/* Départ card */}
            <div style={departStyle} onClick={departIsBack ? () => setSwapped(!swapped) : undefined}>
              <div className={`max-w-sm mx-auto bg-surface rounded-xl py-6 px-4 border border-surface-2 card-glow`}>
                <StationPicker
                  label="Départ"
                  value={from}
                  onChange={setFrom}
                  onAddressCoords={setFromCoords}
                  userCoords={userCoords}
                  iconRotated={false}
                />
              </div>
            </div>

            {/* Arrivée card */}
            <div style={arriveeStyle} onClick={!departIsBack ? () => setSwapped(!swapped) : undefined}>
              <div className={`max-w-sm mx-auto bg-surface rounded-xl py-6 px-4 border border-surface-2 card-glow`}>
                <StationPicker
                  label="Arrivée"
                  value={to}
                  onChange={setTo}
                  iconRotated={true}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Search CTA — apparaît avec animation */}
        <button
          onClick={() => canSearch && onSearch({ from: from!.id, to: to!.id, fromAddressCoords: fromCoords ?? undefined })}
          disabled={!canSearch}
          style={{
            opacity: canSearch ? 1 : 0,
            transform: canSearch ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 300ms ease-out, transform 300ms ease-out',
          }}
          className="w-full py-4 rounded-lg font-semibold text-base bg-tam-blue text-white active:opacity-80"
        >
          Calculer l'itinéraire
        </button>
      </div>

      {/* Footer FABs */}
      <div
        className="sticky bottom-0 bg-surface border-t border-surface-2 flex justify-center gap-8 py-3"
        style={{ paddingBottom: 'max(0.75rem, calc(0.75rem + env(safe-area-inset-bottom)))' }}
      >
        {/* GPS FAB */}
        <button
          onClick={onGeoToggle}
          title={geoEnabled ? 'Désactiver la géolocalisation' : 'Activer la géolocalisation'}
          className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <div className="relative">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={geoEnabled ? 'text-accent' : 'text-red-400'}
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {!geoEnabled && (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                className="absolute inset-0 text-red-400"
              >
                <line x1="23" y1="1" x2="1" y2="23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
        </button>

        {/* Favoris FAB */}
        <button
          onClick={() => setShowFavoritesModal(true)}
          className="w-14 h-14 rounded-full bg-surface-2 flex flex-col items-center justify-center gap-1 active:opacity-70 transition-opacity"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-secondaire"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span className="text-[10px] font-medium leading-none text-secondaire">Favoris</span>
        </button>
      </div>

      {/* Favorites bottom-sheet modal */}
      {showFavoritesModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={() => setShowFavoritesModal(false)}
        >
          <div
            className="bg-surface rounded-t-2xl w-full max-w-sm"
            style={{ paddingBottom: 'max(1.5rem, calc(1rem + env(safe-area-inset-bottom)))' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-surface-2">
              <h2 className="font-semibold text-texte text-base">Favoris</h2>
              <button
                onClick={() => setShowFavoritesModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-surface-2 text-secondaire active:opacity-70"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {favorites.length === 0 ? (
              <p className="px-4 py-8 text-sm text-secondaire text-center">Aucun favori enregistré</p>
            ) : (
              <div className="px-4 pt-3 space-y-2">
                {favorites.map(fav => (
                  <div key={fav.id} className="flex items-center bg-surface-2 rounded-lg overflow-hidden">
                    <button
                      className="flex-1 text-left px-3 py-3 active:opacity-70"
                      onClick={() => { onSearch({ from: fav.from.id, to: fav.to.id }); setShowFavoritesModal(false) }}
                    >
                      <p className="font-semibold text-texte text-sm">{fav.label}</p>
                      <p className="text-xs text-secondaire mt-0.5">{fav.from.name} → {fav.to.name}</p>
                    </button>
                    <button
                      onClick={() => removeFavorite(fav.id)}
                      className="px-3 py-3 text-retard active:opacity-70"
                      title="Supprimer ce favori"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14H6L5 6"></path>
                        <path d="M10 11v6M14 11v6"></path>
                        <path d="M9 6V4h6v2"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
