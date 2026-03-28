import LineBadge from './LineBadge'
import { formatDuration } from '../lib/format-time'
import type { LocalJourney } from '../lib/itinerary'

interface JourneyTimelineProps {
  journey: LocalJourney
}

export default function JourneyTimeline({ journey }: JourneyTimelineProps) {
  const firstStop = journey.segments[0].fromStop
  const lastStop = journey.segments[journey.segments.length - 1].toStop

  return (
    <div className="w-full bg-surface rounded-lg border border-surface-2 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
        <div className="flex items-center gap-1.5">
          {journey.segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1">
              <LineBadge code={seg.lineCode} size="sm" />
              {i < journey.segments.length - 1 && (
                <span className="text-secondaire text-xs">→</span>
              )}
            </span>
          ))}
        </div>
        <span className="text-sm font-bold text-accent">{formatDuration(journey.totalDuration * 60)}</span>
      </div>

      {/* Timeline verticale */}
      <div className="px-4 py-3">
        {journey.segments.map((seg, i) => {
          const transfer = journey.transferDetails?.[i]
          const isLast = i === journey.segments.length - 1

          return (
            <div key={i}>
              {/* Arrêt de départ du segment */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center w-4">
                  <div className="w-3 h-3 rounded-full border-2 border-accent bg-fond shrink-0" />
                </div>
                <span className="text-sm font-semibold text-texte">{seg.fromStop.name}</span>
              </div>

              {/* Segment : barre colorée + infos */}
              <div className="flex items-stretch gap-3 my-1">
                <div className="flex flex-col items-center w-4">
                  <div className="w-0.5 flex-1 rounded-full" style={{ backgroundColor: seg.lineColor }} />
                </div>
                <div className="flex-1 py-1">
                  <div className="flex items-center gap-2">
                    <LineBadge code={seg.lineCode} size="sm" />
                    <span className="text-xs text-secondaire truncate">dir. {seg.headsign}</span>
                  </div>
                  <p className="text-xs text-secondaire/60 mt-0.5">
                    {seg.stopCount} arrêt{seg.stopCount > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Arrêt d'arrivée du segment (= dernier arrêt global si dernier segment) */}
              {isLast && (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center w-4">
                    <div className="w-3 h-3 rounded-full border-2 border-accent bg-fond shrink-0" />
                  </div>
                  <span className="text-sm font-semibold text-texte">{seg.toStop.name}</span>
                </div>
              )}

              {/* Correspondance */}
              {!isLast && transfer && (
                <div className="flex items-start gap-3 my-1">
                  <div className="flex flex-col items-center w-4 pt-1">
                    <div className="w-3 h-3 rounded-full border-2 border-secondaire bg-fond shrink-0" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-texte">{seg.toStop.name}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {transfer.walkMin > 0 && (
                        <span className="text-xs bg-surface-2 text-secondaire px-2 py-0.5 rounded-full">
                          🚶 {transfer.walkMin} min
                        </span>
                      )}
                      <span className="text-xs bg-surface-2 text-secondaire px-2 py-0.5 rounded-full">
                        ⏱ {transfer.waitMin} min attente
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!isLast && !transfer && (
                <div className="flex items-center gap-3 my-1">
                  <div className="flex flex-col items-center w-4">
                    <div className="w-3 h-3 rounded-full border-2 border-secondaire bg-fond shrink-0" />
                  </div>
                  <span className="text-xs font-medium text-texte">{seg.toStop.name}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer : départ → arrivée */}
      <div className="px-4 py-2 border-t border-surface-2 flex justify-between">
        <span className="text-xs text-secondaire truncate">{firstStop.name}</span>
        <span className="text-xs text-secondaire">→</span>
        <span className="text-xs text-secondaire truncate text-right">{lastStop.name}</span>
      </div>
    </div>
  )
}
