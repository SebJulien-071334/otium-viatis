import { useQuery } from '@tanstack/react-query'

export interface WalkingTime {
  durationSeconds: number
  distanceMeters: number
  walkMinutes: number
}

async function fetchWalkingTime(
  userLat: number,
  userLon: number,
  stopLat: number,
  stopLon: number
): Promise<WalkingTime> {
  const params = new URLSearchParams({
    userLat: String(userLat),
    userLon: String(userLon),
    stopLat: String(stopLat),
    stopLon: String(stopLon),
  })
  const res = await fetch(`/api/walking?${params}`)
  if (!res.ok) throw new Error('Walking time error')
  const data = (await res.json()) as { durationSeconds: number; distanceMeters: number }
  return {
    ...data,
    walkMinutes: Math.ceil(data.durationSeconds / 60),
  }
}

interface UseWalkingTimeParams {
  userLat: number | null
  userLon: number | null
  stopLat: number
  stopLon: number
}

export function useWalkingTime({ userLat, userLon, stopLat, stopLon }: UseWalkingTimeParams) {
  const enabled = userLat !== null && userLon !== null

  const { data, isLoading, error } = useQuery({
    queryKey: ['walking', userLat, userLon, stopLat, stopLon],
    queryFn: () => fetchWalkingTime(userLat!, userLon!, stopLat, stopLon),
    enabled,
    staleTime: 60_000,
    retry: 1,
  })

  return { walking: data ?? null, isLoading: isLoading && enabled, error }
}
