import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Favorite } from '../types/journey'

interface FavoritesState {
  favorites: Favorite[]
  add: (fav: Omit<Favorite, 'id' | 'createdAt'>) => void
  remove: (id: string) => void
  reorder: (fromIndex: number, toIndex: number) => void
}

export const useFavorites = create<FavoritesState>()(
  persist(
    set => ({
      favorites: [],
      add: fav =>
        set(state => ({
          favorites: [
            ...state.favorites,
            { ...fav, id: crypto.randomUUID(), createdAt: Date.now() },
          ],
        })),
      remove: id =>
        set(state => ({
          favorites: state.favorites.filter(f => f.id !== id),
        })),
      reorder: (fromIndex, toIndex) =>
        set(state => {
          const next = [...state.favorites]
          const [item] = next.splice(fromIndex, 1)
          next.splice(toIndex, 0, item)
          return { favorites: next }
        }),
    }),
    { name: 'tam-favorites' }
  )
)
