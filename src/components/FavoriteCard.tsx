import { useFavorites } from '../hooks/useFavorites'
import type { Favorite, JourneyRequest } from '../types/journey'

interface FavoriteCardProps {
  favorite: Favorite
  onSelect: (request: JourneyRequest) => void
}

export default function FavoriteCard({ favorite, onSelect }: FavoriteCardProps) {
  const remove = useFavorites(s => s.remove)

  return (
    <div className="bg-surface rounded-lg border border-surface-2 flex items-stretch overflow-hidden">
      <button
        onClick={() => onSelect({ from: favorite.from.id, to: favorite.to.id })}
        className="flex-1 text-left px-4 py-3"
      >
        <p className="font-semibold text-texte text-sm">{favorite.label}</p>
        <p className="text-xs text-secondaire mt-0.5">
          {favorite.from.name} → {favorite.to.name}
        </p>
      </button>
      <button
        onClick={() => remove(favorite.id)}
        className="px-3 text-secondaire hover:text-alerte hover:bg-alerte/10 transition-colors border-l border-surface-2 text-sm"
        aria-label="Supprimer"
      >
        ✕
      </button>
    </div>
  )
}
