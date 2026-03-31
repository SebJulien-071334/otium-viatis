import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from './pages/Home'
import Journey from './pages/Journey'
import Favorites from './pages/Favorites'
import type { JourneyRequest } from './types/journey'

type Page = 'home' | 'journey' | 'favorites'
type GeoConsent = 'accepted' | 'declined' | null

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function GeoConsentDialog({
  onAccept,
  onDecline,
}: {
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <div
      className="fixed z-50 rounded-2xl shadow-2xl"
      style={{
        top: 'max(0.75rem, env(safe-area-inset-top))',
        left: '0.75rem',
        width: 272,
        backgroundColor: '#2a2a2a',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div>
          <p className="text-sm font-bold text-white leading-snug">www.TEST.com souhaite</p>
        </div>
        <button onClick={onDecline} className="text-white/50 hover:text-white/80 ml-2 mt-0.5 active:opacity-60 text-base leading-none">✕</button>
      </div>
      <div className="flex items-center gap-2 px-4 pb-4">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" style={{ color: '#9aa0a6' }}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span className="text-sm" style={{ color: '#e8eaed' }}>Connaître votre position</span>
      </div>

      {/* Boutons pill empilés */}
      <div className="px-3 pb-4 flex flex-col gap-2">
        <button
          onClick={onAccept}
          className="w-full py-2.5 rounded-full text-sm font-medium text-white text-center active:opacity-80"
          style={{ backgroundColor: '#1a4a6e' }}
        >
          Autoriser pendant la visite du site
        </button>
        <button
          onClick={onAccept}
          className="w-full py-2.5 rounded-full text-sm font-medium text-white text-center active:opacity-80"
          style={{ backgroundColor: '#1a4a6e' }}
        >
          Autoriser cette fois-ci
        </button>
        <button
          onClick={onDecline}
          className="w-full py-2.5 rounded-full text-sm font-medium text-white text-center active:opacity-80"
          style={{ backgroundColor: '#1a4a6e' }}
        >
          Ne jamais autoriser
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [journeyRequest, setJourneyRequest] = useState<JourneyRequest | null>(null)
  const [geoConsent, setGeoConsent] = useState<GeoConsent>(null)
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Géolocalisation non supportée par ce navigateur')
      setGeoConsent('declined')
      return
    }
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setGeoError(null)
      },
      err => {
        setUserCoords(null)
        setGeoConsent('declined')
        const messages: Record<number, string> = {
          1: 'GPS refusé — activez-le dans les réglages du navigateur',
          2: 'Position GPS indisponible',
          3: 'Délai GPS dépassé',
        }
        setGeoError(messages[err.code] ?? 'Erreur GPS inconnue')
      },
      { timeout: 10_000, maximumAge: 60_000 }
    )
  }

  const handleAccept = () => {
    setGeoConsent('accepted')
    requestGeolocation()
  }

  const handleDecline = () => {
    setGeoConsent('declined')
  }

  const handleGeoToggle = () => {
    if (geoConsent === 'accepted') {
      setGeoConsent('declined')
      setUserCoords(null)
      setGeoError(null)
    } else {
      setGeoConsent('accepted')
      requestGeolocation()
    }
  }

  const handleSearch = (request: JourneyRequest) => {
    setJourneyRequest(request)
    setPage('journey')
  }

  return (
    <QueryClientProvider client={queryClient}>
      {page === 'home' && (
        <Home
          onSearch={handleSearch}
          geoEnabled={geoConsent === 'accepted'}
          onGeoToggle={handleGeoToggle}
          geoError={geoError}
          userCoords={userCoords}
        />
      )}
      {page === 'journey' && journeyRequest && (
        <Journey
          request={journeyRequest}
          userCoords={userCoords}
          onBack={() => setPage('home')}
        />
      )}
      {page === 'favorites' && (
        <Favorites
          onSelect={handleSearch}
          onBack={() => setPage('home')}
        />
      )}

      {geoConsent === null && (
        <GeoConsentDialog onAccept={handleAccept} onDecline={handleDecline} />
      )}
    </QueryClientProvider>
  )
}
