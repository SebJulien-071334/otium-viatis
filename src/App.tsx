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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
      <div className="rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" style={{ backgroundColor: '#1e1e1e' }}>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center mb-2">
            <h2 className="font-bold text-texte text-base">Pour une meilleure expérience</h2>
          </div>
          <p className="text-sm text-secondaire leading-relaxed">
            Accès à votre position pour calculer le temps de marche et vérifier
            si vous avez le temps avant le prochain tram.
          </p>
        </div>
        <div className="px-5 pb-5 flex flex-col gap-3">
          <button
            onClick={onAccept}
            className="w-full py-3 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: '#1a73e8' }}
          >
            Autoriser pendant la visite du site
          </button>
          <button
            onClick={onAccept}
            className="w-full py-3 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: '#1a73e8' }}
          >
            Autoriser cette fois-ci
          </button>
          <button
            onClick={onDecline}
            className="w-full py-3 rounded-lg text-sm font-medium"
            style={{ border: '1px solid #1a73e8', color: '#1a73e8' }}
          >
            Ne jamais autoriser
          </button>
        </div>
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
