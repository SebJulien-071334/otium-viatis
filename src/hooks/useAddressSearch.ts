import { useQuery } from '@tanstack/react-query'

export interface BanAddress {
  id: string
  label: string
  lat: number
  lon: number
}

async function fetchBan(query: string): Promise<BanAddress[]> {
  const params = new URLSearchParams({ q: query, limit: '5', autocomplete: '1' })
  const res = await fetch(`https://api-adresse.data.gouv.fr/search/?${params}`)
  if (!res.ok) throw new Error('BAN error')
  const data = (await res.json()) as {
    features: Array<{
      properties: { id: string; label: string }
      geometry: { coordinates: [number, number] }
    }>
  }
  return data.features.map(f => ({
    id: f.properties.id,
    label: f.properties.label,
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }))
}

export function useAddressSearch(query: string): { addresses: BanAddress[]; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['ban', query],
    queryFn: () => fetchBan(query),
    enabled: query.length >= 3,
    staleTime: 60_000,
  })
  return { addresses: data ?? [], isLoading: isLoading && query.length >= 3 }
}
