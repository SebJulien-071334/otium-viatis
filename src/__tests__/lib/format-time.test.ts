import { describe, it, expect } from 'vitest'
import { formatNavitiaTime, formatDuration } from '../../lib/format-time'

describe('formatNavitiaTime', () => {
  it('extrait HH:MM depuis un datetime Navitia', () => {
    expect(formatNavitiaTime('20240325T143000')).toBe('14:30')
  })

  it('retourne --:-- pour une chaîne vide', () => {
    expect(formatNavitiaTime('')).toBe('--:--')
  })

  it('retourne --:-- pour une chaîne trop courte', () => {
    expect(formatNavitiaTime('20240325T')).toBe('--:--')
  })

  it('gère minuit correctement', () => {
    expect(formatNavitiaTime('20240325T000500')).toBe('00:05')
  })
})

describe('formatDuration', () => {
  it('formate les secondes en minutes sous 1h', () => {
    expect(formatDuration(600)).toBe('10 min')
  })

  it('formate exactement 1 heure', () => {
    expect(formatDuration(3600)).toBe('1h')
  })

  it('formate 1h30', () => {
    expect(formatDuration(5400)).toBe('1h30')
  })

  it('formate 1h05 avec zéro de remplissage', () => {
    expect(formatDuration(3900)).toBe('1h05')
  })

  it('formate 0 secondes', () => {
    expect(formatDuration(0)).toBe('0 min')
  })
})
