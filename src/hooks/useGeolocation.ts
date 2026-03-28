import { useState } from 'react'

interface GeolocationState {
  coords: GeolocationCoordinates | null
  loading: boolean
  error: string | null
}

const ERROR_MESSAGES: Record<number, string> = {
  1: 'Accès à la position refusé',
  2: 'Position indisponible',
  3: 'Délai dépassé',
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: false,
    error: null,
  })

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setState({ coords: null, loading: false, error: 'Géolocalisation non supportée' })
      return
    }
    setState(s => ({ ...s, loading: true, error: null }))
    navigator.geolocation.getCurrentPosition(
      pos => setState({ coords: pos.coords, loading: false, error: null }),
      err =>
        setState({
          coords: null,
          loading: false,
          error: ERROR_MESSAGES[err.code] ?? 'Erreur GPS inconnue',
        }),
      { timeout: 10_000, maximumAge: 60_000 }
    )
  }

  return { ...state, requestLocation }
}
