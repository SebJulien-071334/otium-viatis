import { useState } from 'react'
import StationPicker from '../components/StationPicker'
import { useFavorites } from '../hooks/useFavorites'
import type { JourneyRequest } from '../types/journey'

type Step = 'intro' | 'depart' | 'arrivee' | 'summary'

interface HomeProps {
  onSearch: (request: JourneyRequest) => void
  geoEnabled: boolean
  onGeoToggle: () => void
  geoError: string | null
  userCoords: { lat: number; lon: number } | null
}

export default function Home({ onSearch, geoEnabled, onGeoToggle, geoError, userCoords }: HomeProps) {
  const [from, setFrom] = useState<{ id: string; name: string; lines?: string[] } | null>(null)
  const [to,   setTo]   = useState<{ id: string; name: string; lines?: string[] } | null>(null)
  const [fromCoords, setFromCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [step, setStep] = useState<Step>('intro')
  const [dir,  setDir]  = useState<'forward' | 'back'>('forward')

  const favorites    = useFavorites(s => s.favorites)
  const removeFavorite = useFavorites(s => s.remove)

  const advance = (next: Step) => { setDir('forward'); setStep(next) }
  const goBack  = (prev: Step) => { setDir('back');    setStep(prev) }

  const slideAnim = dir === 'forward' ? 'slideFromRight 280ms ease-out forwards' : 'slideFromLeft 280ms ease-out forwards'

  return (
    <div className="bg-fond flex flex-col relative overflow-hidden" style={{ height: '100dvh' }}>
      <style>{`
        @keyframes slideFromRight {
          from { transform: translateX(56px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideFromLeft {
          from { transform: translateX(-56px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        .tram-glow {
          box-shadow:
            0 0 7px rgba(0, 200, 255, 0.40),
            0 0 18px rgba(0, 112, 192, 0.18);
        }
      `}</style>

      <img
        src="/mapfond.webp"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        style={{ opacity: 0.25 }}
      />

      <div
        className="flex-1 flex flex-col justify-start px-3 sm:px-4"
        style={{ paddingTop: 'max(12vh, calc(8vh + env(safe-area-inset-top)))' }}
      >
        {geoError && (
          <div className="bg-surface border border-retard/30 rounded-lg px-4 py-2 mb-3">
            <p className="text-xs text-retard">{geoError}</p>
          </div>
        )}

        <div className="max-w-sm mx-auto w-full">

          {/* ── Step intro ──────────────────────────────────────── */}
          {step === 'intro' && (
            <div key="intro" style={{ animation: slideAnim }}>
              <div className="bg-surface rounded-3xl shadow-sm border border-surface-2 tram-glow">
                <button
                  type="button"
                  onClick={() => advance('depart')}
                  className="w-full px-6 py-10 text-center active:opacity-90 transition-opacity"
                >
                  <p className="text-texte font-bold text-xl leading-snug">
                    Choisir votre itinéraire
                  </p>
                  <p className="text-secondaire text-sm mt-2">Calculez votre trajet en tram</p>
                </button>
              </div>
            </div>
          )}

          {/* ── Step départ ─────────────────────────────────────── */}
          {step === 'depart' && (
            <div key="depart" style={{ animation: slideAnim }}>
              <div className="bg-white rounded-3xl px-4 py-5 shadow-sm border border-surface-2">
                <StationPicker
                  label="Départ"
                  value={from}
                  onChange={setFrom}
                  onAddressCoords={setFromCoords}
                  userCoords={userCoords}
                  iconRotated={false}
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => { setFrom(null); setFromCoords(null); goBack('intro') }}
                  className="flex-1 py-3 rounded-2xl border border-surface-2 bg-surface text-secondaire font-semibold text-sm active:opacity-70"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => { if (from) advance('arrivee') }}
                  disabled={!from}
                  className="flex-1 py-3 rounded-2xl bg-tam-blue text-white font-semibold text-sm active:opacity-80"
                >
                  Valider
                </button>
              </div>
            </div>
          )}

          {/* ── Step arrivée ────────────────────────────────────── */}
          {step === 'arrivee' && (
            <div key="arrivee" style={{ animation: slideAnim }}>
              <div className="bg-white rounded-3xl px-4 py-5 shadow-sm border border-surface-2">
                <StationPicker
                  label="Arrivée"
                  value={to}
                  onChange={setTo}
                  iconRotated={true}
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => { setTo(null); setFrom(null); goBack('depart') }}
                  className="flex-1 py-3 rounded-2xl border border-surface-2 bg-surface text-secondaire font-semibold text-sm active:opacity-70"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => { if (to) advance('summary') }}
                  disabled={!to}
                  className="flex-1 py-3 rounded-2xl bg-tam-blue text-white font-semibold text-sm active:opacity-80"
                >
                  Valider
                </button>
              </div>
            </div>
          )}

          {/* ── Step résumé ─────────────────────────────────────── */}
          {step === 'summary' && (
            <div key="summary" style={{ animation: slideAnim }}>
              <div className="bg-surface rounded-3xl px-5 py-5 shadow-sm border border-surface-2 tram-glow">
                {/* Départ */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-tam-blue/10 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="text-tam-blue">
                      <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                        <path d="M19.353 6.5H16.49V9H6.404v6H16.49v2.5h2.864A9.99 9.99 0 0 1 11 22C5.477 22 1 17.523 1 12S5.477 2 11 2a9.99 9.99 0 0 1 8.353 4.5"/>
                        <path d="m18.99 8l4 4l-4 4h-1v-2.5h-10v-3h10V8z"/>
                      </g>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-secondaire uppercase tracking-wider">Départ</p>
                    <p className="font-semibold text-texte text-sm truncate">{from?.name}</p>
                  </div>
                </div>

                {/* Séparateur */}
                <div className="flex items-center gap-3 my-2">
                  <div className="w-8 flex justify-center">
                    <div className="w-px h-5 bg-surface-2" />
                  </div>
                </div>

                {/* Arrivée */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="text-accent rotate-180">
                      <g fill="currentColor" fillRule="evenodd" clipRule="evenodd">
                        <path d="M19.353 6.5H16.49V9H6.404v6H16.49v2.5h2.864A9.99 9.99 0 0 1 11 22C5.477 22 1 17.523 1 12S5.477 2 11 2a9.99 9.99 0 0 1 8.353 4.5"/>
                        <path d="m18.99 8l4 4l-4 4h-1v-2.5h-10v-3h10V8z"/>
                      </g>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-secondaire uppercase tracking-wider">Arrivée</p>
                    <p className="font-semibold text-texte text-sm truncate">{to?.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => { setFrom(null); setTo(null); setFromCoords(null); advance('intro') }}
                  className="flex-1 py-3 rounded-2xl border border-surface-2 bg-surface text-tam-blue font-semibold text-sm active:opacity-70"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={() => onSearch({ from: from!.id, to: to!.id, fromAddressCoords: fromCoords ?? undefined })}
                  className="flex-1 py-3 rounded-2xl bg-tam-blue text-white font-semibold text-sm active:opacity-80"
                >
                  Go
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer FABs */}
      <div
        className="sticky bottom-0 flex justify-center gap-8 py-3"
        style={{ paddingBottom: 'max(0.75rem, calc(0.75rem + env(safe-area-inset-bottom)))' }}
      >
        {/* GPS FAB */}
        <button
          onClick={onGeoToggle}
          title={geoEnabled ? 'Désactiver la géolocalisation' : 'Activer la géolocalisation'}
          className="w-14 h-14 rounded-full flex items-center justify-center active:opacity-70 transition-opacity bg-white"
          style={{ boxShadow: '0 0 10px rgba(8,145,178,0.35), 0 0 24px rgba(8,145,178,0.18)' }}
        >
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={geoEnabled ? 'text-accent' : 'text-red-400'}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {!geoEnabled && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="absolute inset-0 text-red-400">
                <line x1="23" y1="1" x2="1" y2="23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
        </button>

        {/* Favoris FAB */}
        <button
          onClick={() => setShowFavoritesModal(true)}
          className="w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1 active:opacity-70 transition-opacity bg-white"
          style={{ boxShadow: '0 0 10px rgba(8,145,178,0.35), 0 0 24px rgba(8,145,178,0.18)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondaire">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span className="text-[10px] font-medium leading-none text-secondaire">Favoris</span>
        </button>
      </div>

      {/* Favorites bottom-sheet */}
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
