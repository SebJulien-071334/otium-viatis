export const TAM_COLORS = {
  L1: { bg: '#0070C0', text: '#FFFFFF', label: 'Ligne 1' },
  L2: { bg: '#F7901E', text: '#FFFFFF', label: 'Ligne 2' },
  L3: { bg: '#8DC63F', text: '#FFFFFF', label: 'Ligne 3' },
  L4: { bg: '#EE1C25', text: '#FFFFFF', label: 'Ligne 4' },
  L5: { bg: '#9E1F63', text: '#FFFFFF', label: 'Ligne 5' },
} as const

export type TamLineKey = keyof typeof TAM_COLORS

export function getTamColor(lineCode: string): { bg: string; text: string; label: string } | null {
  const code = lineCode.toUpperCase()
  const key = (code.startsWith('L') ? code : `L${code}`) as TamLineKey
  return TAM_COLORS[key] ?? null
}
