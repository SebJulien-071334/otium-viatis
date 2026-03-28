export type TransportMode = 'tram' | 'bus' | 'walk' | 'transfer' | 'waiting' | 'unknown'

export interface JourneyStep {
  mode: TransportMode
  line?: string
  direction?: string
  from: string
  to: string
  departureTime: string
  arrivalTime: string
  duration: number
  stopCount?: number
}

export interface Journey {
  id: string
  departureTime: string
  arrivalTime: string
  totalDuration: number
  transfers: number
  steps: JourneyStep[]
  co2?: number
}

export interface JourneyRequest {
  from: string
  to: string
  fromAddressCoords?: { lat: number; lon: number }
  datetime?: string
  datetimeRepresents?: 'departure' | 'arrival'
}

export interface Station {
  id: string
  name: string
  lines: string[]
  coord: { lat: number; lon: number }
}

export interface Favorite {
  id: string
  label: string
  from: { id: string; name: string }
  to: { id: string; name: string }
  createdAt: number
}
