interface WalkIndicatorProps {
  walkMinutes: number
  nextTramMinutes: number
}

export default function WalkIndicator({ walkMinutes, nextTramMinutes }: WalkIndicatorProps) {
  const margin = nextTramMinutes - walkMinutes

  const walkActive = margin > 5
  const runActive = margin >= 0 && margin <= 5

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-surface rounded-lg border border-surface-2">
      {/* Temps de marche */}
      <div className="flex-1">
        <p className="text-xs text-secondaire">À pied jusqu'à la station</p>
        <p className="text-sm font-bold text-texte">{walkMinutes} min</p>
      </div>

      {/* Indicateur style feu piéton */}
      <div className="flex items-center gap-3">
        {/* Personnage qui marche */}
        <div className={`flex flex-col items-center gap-0.5 transition-opacity ${walkActive ? 'opacity-100' : 'opacity-20'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
            className={walkActive ? 'text-green-400' : 'text-secondaire'}>
            <path fill="currentColor" d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2s-2 .9-2 2s.9 2 2 2M9.8 8.9L7 23h2.1l1.8-8l2.1 2v6h2v-7.5l-2.1-2l.6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6a2.145 2.145 0 0 0-2.65-.84L6 8.3V13h2V9.6z"/>
          </svg>
          <div className={`w-1.5 h-1.5 rounded-full ${walkActive ? 'bg-green-400' : 'bg-secondaire'}`} />
        </div>

        {/* Personnage qui court */}
        <div className={`flex flex-col items-center gap-0.5 transition-opacity ${runActive ? 'opacity-100' : 'opacity-20'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
            className={runActive ? 'text-orange-400' : 'text-secondaire'}>
            <path fill="currentColor" d="M17 2a2 2 0 1 0 0 4a2 2 0 1 0 0-4m-.35 9.46a2 2 0 0 0 1.52.7c.4 0 .81-.12 1.16-.38l2.76-1.97l-1.16-1.63l-2.76 1.97l-1.96-2.28c-.43-.51-1.03-.86-1.69-.99l-3.65-.73c-.81-.16-1.65.2-2.09.9l-2.13 3.41l1.7 1.06l2.13-3.41l2.04.41L7.43 17H2v2h5.43c.7 0 1.36-.37 1.71-.97l1.92-3.2l5.14 1.03l1.83 6.41l1.92-.55l-1.83-6.41a2 2 0 0 0-1.53-1.41l-3.01-.6l1.91-3.18l1.15 1.34Z"/>
          </svg>
          <div className={`w-1.5 h-1.5 rounded-full ${runActive ? 'bg-orange-400' : 'bg-secondaire'}`} />
        </div>
      </div>
    </div>
  )
}
