export const TAM_COLORS = {
  L1: { bg: '#005CA9', text: '#FFFFFF', label: 'Ligne 1' },
  L2: { bg: '#EF7D00', text: '#FFFFFF', label: 'Ligne 2' },
  L3: { bg: '#C8D400', text: '#000000', label: 'Ligne 3' },
  L4: { bg: '#4B2A0E', text: '#FFFFFF', label: 'Ligne 4' },
  L5: { bg: '#287431', text: '#FFFFFF', label: 'Ligne 5' },
} as const

export type TamLineKey = keyof typeof TAM_COLORS

export function getTamColor(lineCode: string): { bg: string; text: string; label: string } | null {
  const code = lineCode.toUpperCase()
  const key = (code.startsWith('L') ? code : `L${code}`) as TamLineKey
  return TAM_COLORS[key] ?? null
}
