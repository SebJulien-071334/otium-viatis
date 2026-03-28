import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

interface BanFeature {
  properties: { id: string; label: string }
  geometry: { coordinates: [number, number] }
}

interface BanResult {
  id: string
  label: string
  navitiaCoord: string
}

async function searchBan(query: string): Promise<BanResult[]> {
  const params = new URLSearchParams({ q: query, limit: '6', autocomplete: '1' })
  const res = await fetch(`https://api-adresse.data.gouv.fr/search/?${params}`)
  if (!res.ok) throw new Error('BAN error')
  const data = (await res.json()) as { features: BanFeature[] }
  return data.features.map(f => ({
    id: f.properties.id,
    label: f.properties.label,
    navitiaCoord: `${f.geometry.coordinates[0]};${f.geometry.coordinates[1]}`,
  }))
}

interface AddressSearchProps {
  label: string
  value: { id: string; name: string } | null
  onChange: (result: { id: string; name: string }) => void
}

export default function AddressSearch({ label, value, onChange }: AddressSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['ban', query],
    queryFn: () => searchBan(query),
    enabled: query.length >= 3,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
        >
          {value ? (
            <span className="text-gray-800 font-medium">{value.name}</span>
          ) : (
            <span className="text-gray-400">Entrer une adresse…</span>
          )}
        </button>
      ) : (
        <div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-tam-blue rounded-xl">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ex: 1 place de la Comédie, Montpellier"
              className="flex-1 text-sm outline-none text-gray-800 bg-transparent"
            />
            <button
              onClick={() => { setOpen(false); setQuery('') }}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ✕
            </button>
          </div>

          <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-y-auto">
            {query.length >= 3 && isLoading && (
              <div className="px-4 py-3 text-gray-400 text-sm">Recherche…</div>
            )}
            {query.length >= 3 &&
              !isLoading &&
              (data ?? []).map(result => (
                <button
                  key={result.id}
                  onClick={() => {
                    onChange({ id: result.navitiaCoord, name: result.label })
                    setOpen(false)
                    setQuery('')
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 text-sm text-gray-800"
                >
                  {result.label}
                </button>
              ))}
            {query.length >= 3 && !isLoading && (data ?? []).length === 0 && (
              <div className="px-4 py-3 text-gray-400 text-sm">Aucun résultat</div>
            )}
            {query.length < 3 && (
              <div className="px-4 py-3 text-gray-400 text-sm">Tapez au moins 3 caractères</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
