import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGeolocation } from '../../hooks/useGeolocation'

function mockGeolocation(impl: Partial<Geolocation>) {
  Object.defineProperty(global.navigator, 'geolocation', {
    value: impl,
    configurable: true,
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useGeolocation', () => {
  it('état initial : coords null, pas de chargement ni erreur', () => {
    const { result } = renderHook(() => useGeolocation())
    expect(result.current.coords).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('passe loading=true au moment de la demande', () => {
    mockGeolocation({ getCurrentPosition: vi.fn() }) // ne résout jamais
    const { result } = renderHook(() => useGeolocation())
    act(() => { result.current.requestLocation() })
    expect(result.current.loading).toBe(true)
  })

  it('retourne les coords en cas de succès', () => {
    const mockCoords = { latitude: 43.608, longitude: 3.879, accuracy: 10 } as GeolocationCoordinates
    mockGeolocation({
      getCurrentPosition: vi.fn((onSuccess) => onSuccess({ coords: mockCoords } as GeolocationPosition)),
    })
    const { result } = renderHook(() => useGeolocation())
    act(() => { result.current.requestLocation() })
    expect(result.current.coords).toEqual(mockCoords)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('affiche "Accès à la position refusé" si permission refusée (code 1)', () => {
    mockGeolocation({
      getCurrentPosition: vi.fn((_ok, onError) =>
        onError({ code: 1, message: 'denied' } as GeolocationPositionError)
      ),
    })
    const { result } = renderHook(() => useGeolocation())
    act(() => { result.current.requestLocation() })
    expect(result.current.error).toBe('Accès à la position refusé')
    expect(result.current.loading).toBe(false)
  })

  it('affiche "Position indisponible" si code 2', () => {
    mockGeolocation({
      getCurrentPosition: vi.fn((_ok, onError) =>
        onError({ code: 2, message: 'unavailable' } as GeolocationPositionError)
      ),
    })
    const { result } = renderHook(() => useGeolocation())
    act(() => { result.current.requestLocation() })
    expect(result.current.error).toBe('Position indisponible')
  })

  it('affiche "Géolocalisation non supportée" si API absente', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    })
    const { result } = renderHook(() => useGeolocation())
    act(() => { result.current.requestLocation() })
    expect(result.current.error).toBe('Géolocalisation non supportée')
  })
})
