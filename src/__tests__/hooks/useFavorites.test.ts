import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFavorites } from '../../hooks/useFavorites'

beforeEach(() => {
  localStorage.clear()
  useFavorites.setState({ favorites: [] })
})

describe('useFavorites', () => {
  it('démarre avec une liste vide', () => {
    const { result } = renderHook(() => useFavorites())
    expect(result.current.favorites).toHaveLength(0)
  })

  it('ajoute un favori avec id et createdAt', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.add({
        label: 'Maison → Travail',
        from: { id: 'coord:1', name: 'Maison' },
        to: { id: 'coord:2', name: 'Travail' },
      })
    })
    expect(result.current.favorites).toHaveLength(1)
    expect(result.current.favorites[0].label).toBe('Maison → Travail')
    expect(result.current.favorites[0].id).toBeTruthy()
    expect(result.current.favorites[0].createdAt).toBeGreaterThan(0)
  })

  it('génère des ids uniques pour chaque favori', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.add({ label: 'A', from: { id: 'a', name: 'A' }, to: { id: 'b', name: 'B' } })
      result.current.add({ label: 'B', from: { id: 'c', name: 'C' }, to: { id: 'd', name: 'D' } })
    })
    const [f1, f2] = result.current.favorites
    expect(f1.id).not.toBe(f2.id)
  })

  it('supprime un favori par id', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.add({ label: 'Test', from: { id: 'a', name: 'A' }, to: { id: 'b', name: 'B' } })
    })
    const id = result.current.favorites[0].id
    act(() => { result.current.remove(id) })
    expect(result.current.favorites).toHaveLength(0)
  })

  it('réordonne les favoris', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.add({ label: 'Premier', from: { id: 'a', name: 'A' }, to: { id: 'b', name: 'B' } })
      result.current.add({ label: 'Deuxième', from: { id: 'c', name: 'C' }, to: { id: 'd', name: 'D' } })
    })
    act(() => { result.current.reorder(0, 1) })
    expect(result.current.favorites[0].label).toBe('Deuxième')
    expect(result.current.favorites[1].label).toBe('Premier')
  })
})
