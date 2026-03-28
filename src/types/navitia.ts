export interface NavitiaCoord {
  lat: string
  lon: string
}

export interface NavitiaLine {
  id: string
  name: string
  code: string
  color: string
  text_color: string
  commercial_mode: { id: string; name: string }
}

export interface NavitiaStopArea {
  id: string
  name: string
  label: string
  timezone: string
  coord: NavitiaCoord
  lines?: NavitiaLine[]
}

export interface NavitiaStopPoint {
  id: string
  name: string
  label: string
  coord: NavitiaCoord
  stop_area: NavitiaStopArea
}

export interface NavitiaAddress {
  id: string
  name: string
  label: string
  coord: NavitiaCoord
  house_number: number
}

export interface NavitiaPlace {
  id: string
  name: string
  quality?: number
  embedded_type: 'stop_area' | 'stop_point' | 'address' | 'poi' | 'administrative_region'
  stop_area?: NavitiaStopArea
  stop_point?: NavitiaStopPoint
  address?: NavitiaAddress
}

export interface NavitiaDisplayInfo {
  network: string
  direction: string
  label: string
  color: string
  text_color: string
  code: string
  description: string
  commercial_mode: string
  physical_mode: string
  links: NavitiaLink[]
}

export interface NavitiaStopDateTime {
  stop_point: NavitiaStopPoint
  departure_date_time: string
  arrival_date_time: string
  additional_informations: string[]
}

export interface NavitiaSection {
  id: string
  type: 'public_transport' | 'street_network' | 'waiting' | 'transfer' | 'crow_fly'
  duration: number
  departure_date_time: string
  arrival_date_time: string
  from: NavitiaPlace
  to: NavitiaPlace
  display_informations?: NavitiaDisplayInfo
  stop_date_times?: NavitiaStopDateTime[]
  mode?: string
}

export interface NavitiaJourney {
  duration: number
  nb_transfers: number
  departure_date_time: string
  arrival_date_time: string
  status: string
  sections: NavitiaSection[]
  co2_emission?: { value: number; unit: string }
}

export interface NavitiaLink {
  id: string
  type: string
}

export interface NavitiaJourneysResponse {
  journeys?: NavitiaJourney[]
  links: NavitiaLink[]
  context?: {
    timezone: string
    current_datetime: string
  }
  error?: NavitiaError
}

export interface NavitiaPlacesResponse {
  places?: NavitiaPlace[]
  links: NavitiaLink[]
  error?: NavitiaError
}

export interface NavitiaError {
  id: string
  message: string
}
