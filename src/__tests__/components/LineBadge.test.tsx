import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LineBadge from '../../components/LineBadge'

describe('LineBadge', () => {
  it('affiche le code de la ligne', () => {
    render(<LineBadge code="L1" />)
    expect(screen.getByText('L1')).toBeInTheDocument()
  })

  it('applique la couleur officielle TAM pour L1 (bleu)', () => {
    render(<LineBadge code="L1" />)
    expect(screen.getByText('L1')).toHaveStyle({ backgroundColor: '#0070C0', color: '#FFFFFF' })
  })

  it('applique la couleur officielle TAM pour L2 (orange)', () => {
    render(<LineBadge code="L2" />)
    expect(screen.getByText('L2')).toHaveStyle({ backgroundColor: '#F7901E' })
  })

  it('applique gris pour une ligne inconnue', () => {
    render(<LineBadge code="X9" />)
    expect(screen.getByText('X9')).toHaveStyle({ backgroundColor: '#6b7280' })
  })

  it('applique la taille sm', () => {
    render(<LineBadge code="L1" size="sm" />)
    const badge = screen.getByText('L1')
    expect(badge.className).toContain('text-xs')
  })

  it('applique la taille md par défaut', () => {
    render(<LineBadge code="L1" />)
    const badge = screen.getByText('L1')
    expect(badge.className).toContain('text-sm')
  })
})
