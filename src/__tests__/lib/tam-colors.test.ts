import { describe, it, expect } from 'vitest'
import { getTamColor, TAM_COLORS } from '../../lib/tam-colors'

describe('getTamColor', () => {
  it('retourne la couleur officielle de la Ligne 1', () => {
    expect(getTamColor('L1')).toEqual(TAM_COLORS.L1)
    expect(getTamColor('L1')?.bg).toBe('#0070C0')
  })

  it('est insensible à la casse', () => {
    expect(getTamColor('l1')).toEqual(TAM_COLORS.L1)
    expect(getTamColor('l2')).toEqual(TAM_COLORS.L2)
  })

  it('retourne null pour une ligne inconnue', () => {
    expect(getTamColor('L9')).toBeNull()
    expect(getTamColor('')).toBeNull()
  })

  it('retourne les couleurs des 5 lignes TAM', () => {
    const lines = ['L1', 'L2', 'L3', 'L4', 'L5']
    lines.forEach(line => {
      const color = getTamColor(line)
      expect(color).not.toBeNull()
      expect(color?.bg).toMatch(/^#[0-9A-F]{6}$/i)
      expect(color?.text).toBe('#FFFFFF')
    })
  })
})
