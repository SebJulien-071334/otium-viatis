import { useFavorites } from '../hooks/useFavorites'
import FavoriteCard from '../components/FavoriteCard'
import type { JourneyRequest } from '../types/journey'

interface FavoritesProps {
  onSelect: (request: JourneyRequest) => void
  onBack: () => void
}

export default function Favorites({ onSelect, onBack }: FavoritesProps) {
  const favorites = useFavorites(s => s.favorites)

  return (
    <div className="min-h-screen bg-fond flex flex-col">
      {/* Header */}
      <div className="bg-surface px-4 pt-12 pb-5 safe-top border-b border-surface-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-texte text-xl p-1" aria-label="Retour">
            ←
          </button>
          <h1 className="text-texte text-xl font-bold">Mes favoris</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">⭐</span>
            <p className="text-secondaire font-medium">Aucun favori enregistré</p>
            <p className="text-secondaire/60 text-sm mt-1">
              Après une recherche, enregistre un trajet pour le retrouver ici.
            </p>
            <button
              onClick={onBack}
              className="mt-6 px-6 py-3 bg-tam-blue text-white rounded-lg font-semibold text-sm"
            >
              Chercher un itinéraire
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map(fav => (
              <FavoriteCard key={fav.id} favorite={fav} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="bg-surface border-t border-surface-2 px-4 py-2 flex justify-around safe-bottom">
        <button
          onClick={onBack}
          className="flex flex-col items-center py-1 gap-0.5 text-secondaire"
        >
          <span className="text-xl">🗺</span>
          <span className="text-xs">Itinéraire</span>
        </button>
        <button className="flex flex-col items-center py-1 gap-0.5 text-accent">
          <span className="text-xl">⭐</span>
          <span className="text-xs font-medium">Favoris</span>
        </button>
      </nav>
    </div>
  )
}
