import { useQuery } from '@tanstack/react-query'
import type { NavitiaJourneysResponse, NavitiaPlacesResponse } from '../types/navitia'
import type { JourneyRequest } from '../types/journey'

async function fetchNavitia<T>(path: string, params: URLSearchParams): Promise<T> {
  params.set('path', path)
  const res = await fetch(`/api/navitia?${params}`)
  if (!res.ok) throw new Error(`Navitia HTTP ${res.status}`)
  const data = (await res.json()) as T & { error?: { id: string; message: string } }
  if ((data as { error?: { message: string } }).error) {
    throw new Error((data as { error: { message: string } }).error.message)
  }
  return data
}

export function useJourneys(request: JourneyRequest | null) {
  return useQuery({
    queryKey: ['journeys', request],
    queryFn: () => {
      if (!request) throw new Error('No request')
      const params = new URLSearchParams({
        from: request.from,
        to: request.to,
        count: '5',
      })
      if (request.datetime) params.set('datetime', request.datetime)
      if (request.datetimeRepresents) {
        params.set('datetime_represents', request.datetimeRepresents)
      }
      return fetchNavitia<NavitiaJourneysResponse>('journeys', params)
    },
    enabled: !!request,
    staleTime: 30_000,
  })
}

export function usePlaces(query: string) {
  return useQuery({
    queryKey: ['places', query],
    queryFn: () => {
      const params = new URLSearchParams({ q: query, count: '10' })
      params.append('type[]', 'stop_area')
      params.append('type[]', 'address')
      return fetchNavitia<NavitiaPlacesResponse>('places', params)
    },
    enabled: query.length >= 2,
    staleTime: 60_000,
  })
}
