import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FavoriteCard from '../../components/FavoriteCard'
import { useFavorites } from '../../hooks/useFavorites'
import type { Favorite } from '../../types/journey'

const MOCK_FAV: Favorite = {
  id: 'test-fav-id',
  label: 'Mon trajet quotidien',
  from: { id: 'stop:maison', name: 'Maison' },
  to: { id: 'stop:travail', name: 'Travail' },
  createdAt: Date.now(),
}

beforeEach(() => {
  localStorage.clear()
  useFavorites.setState({ favorites: [MOCK_FAV] })
})

describe('FavoriteCard', () => {
  it('affiche le label et le trajet départ → arrivée', () => {
    render(<FavoriteCard favorite={MOCK_FAV} onSelect={vi.fn()} />)
    expect(screen.getByText('Mon trajet quotidien')).toBeInTheDocument()
    expect(screen.getByText(/Maison.*Travail/)).toBeInTheDocument()
  })

  it('appelle onSelect avec la bonne JourneyRequest au tap', async () => {
    const onSelect = vi.fn()
    render(<FavoriteCard favorite={MOCK_FAV} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('Mon trajet quotidien'))
    expect(onSelect).toHaveBeenCalledWith({
      from: 'stop:maison',
      to: 'stop:travail',
    })
  })

  it('supprime le favori du store au clic sur ✕', async () => {
    render(<FavoriteCard favorite={MOCK_FAV} onSelect={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('Supprimer'))
    expect(useFavorites.getState().favorites).toHaveLength(0)
  })
})
