import { getTamColor } from '../lib/tam-colors'

interface LineBadgeProps {
  code: string
  size?: 'sm' | 'md'
}

export default function LineBadge({ code, size = 'md' }: LineBadgeProps) {
  const color = getTamColor(code)
  const bg = color?.bg ?? '#6b7280'
  const text = color?.text ?? '#ffffff'
  const sizeClass =
    size === 'sm'
      ? 'text-xs px-1.5 py-0.5 min-w-[1.5rem] rounded'
      : 'text-sm px-2 py-1 min-w-[2rem] rounded-md'

  return (
    <span
      className={`inline-flex items-center justify-center font-bold leading-none ${sizeClass}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {code}
    </span>
  )
}
