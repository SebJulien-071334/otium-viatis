import { useState } from 'react'
import { useJourney } from '../hooks/useJourney'
import { useRealtime } from '../hooks/useRealtime'
import { useFavorites } from '../hooks/useFavorites'
import { useWalkingTime } from '../hooks/useWalkingTime'
import JourneyTimeline from '../components/JourneyTimeline'
import WalkIndicator from '../components/WalkIndicator'
import LineBadge from '../components/LineBadge'
import type { JourneyRequest } from '../types/journey'
import type { LocalJourney } from '../lib/itinerary'

interface JourneyProps {
  request: JourneyRequest
  userCoords: { lat: number; lon: number } | null
  onBack: () => void
}

function RealtimePanel({ stopName, lineCode, headsign, altStopName }: { stopName: string; lineCode: string; headsign: string; altStopName?: string }) {
  const { data, isLoading, error, dataUpdatedAt } = useRealtime(stopName, lineCode, headsign, altStopName)
  const isStale = dataUpdatedAt > 0 && Date.now() - dataUpdatedAt > 2 * 60 * 1000

  if (isLoading) return <p className="text-xs text-secondaire px-4 py-2">Chargement temps réel…</p>
  if (error || !data?.length) return null

  return (
    <div className="bg-surface rounded-lg border border-surface-2 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h3 className="text-xs font-semibold text-secondaire uppercase tracking-wider">Prochains passages</h3>
        {isStale && <span className="text-xs text-retard">⚠️ Données anciennes</span>}
      </div>
      {data.map((dep, i) => (
        <div key={i} className={`flex items-center justify-between px-4 py-2 ${i > 0 ? 'border-t border-surface-2' : ''}`}
          style={{ opacity: i === 0 ? 1 : i === 1 ? 0.55 : 0.3 }}>
          <div className="flex items-center gap-3">
            <LineBadge code={dep.lineCode} size="sm" />
            <span className={i === 0 ? 'text-sm font-semibold text-texte' : 'text-xs text-secondaire'}>
              {dep.departureTime.slice(0, 5)}
            </span>
            {dep.isTheoretical && <span className="text-xs text-secondaire/60">théo.</span>}
          </div>
          <span className={`font-bold ${dep.isTheoretical ? 'text-secondaire' : 'text-accent'} ${i === 0 ? 'text-lg' : i === 1 ? 'text-sm' : 'text-xs'}`}>
            {dep.waitMinutes === 0 ? 'Imminent' : `${dep.waitMinutes} min`}
          </span>
        </div>
      ))}
    </div>
  )
}

function SaveFavoriteForm({
  journey,
  request,
  onSaved,
}: {
  journey: LocalJourney
  request: JourneyRequest
  onSaved: () => void
}) {
  const [label, setLabel] = useState('')
  const add = useFavorites(s => s.add)
  const from = journey.segments[0].fromStop
  const to = journey.segments[journey.segments.length - 1].toStop

  const handleSave = () => {
    add({
      label: label.trim() || `${from.name} → ${to.name}`,
      from: { id: request.from, name: from.name },
      to: { id: request.to, name: to.name },
    })
    onSaved()
  }

  return (
    <div className="bg-surface rounded-lg border border-tam-blue/50 p-4 space-y-3">
      <p className="text-sm font-semibold text-texte">Ajouter aux favoris</p>
      <input
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder={`${from.name} → ${to.name}`}
        className="w-full px-3 py-2 border border-surface-2 rounded-lg text-sm outline-none focus:border-tam-blue bg-surface-2 text-texte placeholder:text-secondaire"
      />
      <div className="flex gap-2">
        <button onClick={onSaved} className="flex-1 py-2 rounded-lg border border-surface-2 text-secondaire text-sm">
          Annuler
        </button>
        <button onClick={handleSave} className="flex-1 py-2 rounded-lg bg-tam-blue text-white text-sm font-semibold">
          Enregistrer
        </button>
      </div>
    </div>
  )
}

function WalkIndicatorWrapper({
  userCoords,
  stopLat,
  stopLon,
  nextTramMinutes,
}: {
  userCoords: { lat: number; lon: number } | null
  stopLat: number
  stopLon: number
  nextTramMinutes: number
}) {
  const { walking, isLoading } = useWalkingTime({
    userLat: userCoords?.lat ?? null,
    userLon: userCoords?.lon ?? null,
    stopLat,
    stopLon,
  })

  if (!userCoords) return null
  if (isLoading) return (
    <div className="bg-surface rounded-lg p-3 text-center border border-surface-2">
      <p className="text-xs text-accent">Calcul temps de marche…</p>
    </div>
  )
  if (!walking) return null

  return <WalkIndicator walkMinutes={walking.walkMinutes} nextTramMinutes={nextTramMinutes} />
}

function JourneyContent({
  request,
  userCoords,
  onBack,
}: JourneyProps) {
  const { journeys, isLoading, error } = useJourney(request)
  const [showSaveForm, setShowSaveForm] = useState(false)

  const selected = journeys[0]
  const departureStop = selected?.segments[0].fromStop ?? null
  const departureLineCode = selected?.segments[0].lineCode ?? undefined
  const departureHeadsign = selected?.segments[0].headsign ?? undefined
  const realtimeStopName = departureStop?.name ?? null
  const altStopName = selected?.segments[0].secondStop?.name ?? undefined

  // Remonte les données temps réel pour extraire nextTramMinutes
  const { data: realtimeData } = useRealtime(realtimeStopName ?? '', departureLineCode, departureHeadsign, altStopName)
  const nextTramMinutes = realtimeData?.[0]?.waitMinutes ?? null

  return (
    <div className="min-h-screen bg-fond flex flex-col">
      <div className="bg-surface px-4 pt-12 pb-4 border-b border-surface-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-texte text-xl p-1">←</button>
          <div className="flex-1 min-w-0">
            <p className="text-texte font-semibold text-sm">Itinéraire</p>
            {selected && (
              <p className="text-secondaire text-xs truncate">
                {selected.segments[0].fromStop.name} → {selected.segments[selected.segments.length - 1].toStop.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {isLoading && !selected && (
          <div className="bg-surface rounded-lg p-6 text-center border border-surface-2">
            <p className="text-xs text-accent">Calcul du meilleur itinéraire…</p>
          </div>
        )}

        {error && (
          <div className="bg-surface rounded-lg p-6 text-center border border-alerte/30">
            <p className="text-2xl mb-2">🚫</p>
            <p className="text-texte font-medium text-sm">{error}</p>
            <button onClick={onBack} className="mt-4 w-full py-3 rounded-lg bg-tam-blue text-white text-sm font-semibold">
              Modifier le trajet
            </button>
          </div>
        )}

        {selected && (
          <JourneyTimeline journey={selected} />
        )}

        {selected && (
          <>
            {realtimeStopName && departureLineCode && departureHeadsign && (
              <RealtimePanel stopName={realtimeStopName} lineCode={departureLineCode} headsign={departureHeadsign} altStopName={altStopName} />
            )}

            {departureStop && nextTramMinutes !== null && (
              <WalkIndicatorWrapper
                userCoords={userCoords ?? request.fromAddressCoords ?? null}
                stopLat={departureStop.lat}
                stopLon={departureStop.lon}
                nextTramMinutes={nextTramMinutes}
              />
            )}

            {!showSaveForm ? (
              <button
                onClick={() => setShowSaveForm(true)}
                className="w-full py-3 rounded-lg border border-tam-blue/50 text-accent font-semibold text-sm"
              >
                ⭐ Enregistrer en favori
              </button>
            ) : (
              <SaveFavoriteForm
                journey={selected}
                request={request}
                onSaved={() => setShowSaveForm(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Journey({ request, userCoords, onBack }: JourneyProps) {
  return <JourneyContent request={request} userCoords={userCoords} onBack={onBack} />
}
