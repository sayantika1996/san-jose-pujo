import { useState } from 'react'
import { driveMinutes } from '../planner'
import type { Home, Puja } from '../types'

const ll = (p: { lat: number; lng: number }) => `${p.lat},${p.lng}`

export function venueQuery(p: Puja) {
  const v = p.venue
  return v.address ? [v.name, v.address, v.city, 'CA'].filter(Boolean).join(', ') : ll(v)
}

export function placeEmbedUrl(p: Puja) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(venueQuery(p))}&z=14&output=embed`
}

export function routeLinkUrl(home: Home, stops: Puja[], returnHome = true) {
  const q = new URLSearchParams({ api: '1', origin: ll(home), travelmode: 'driving' })
  if (returnHome) {
    q.set('destination', ll(home))
    if (stops.length) q.set('waypoints', stops.map(venueQuery).join('|'))
  } else {
    const last = stops.at(-1)
    q.set('destination', last ? venueQuery(last) : ll(home))
    if (stops.length > 1) q.set('waypoints', stops.slice(0, -1).map(venueQuery).join('|'))
  }
  return `https://www.google.com/maps/dir/?${q}`
}

export function GoogleMapFrame({ src, title, className = 'h-80' }: { src: string; title: string; className?: string }) {
  return (
    <iframe
      title={title}
      src={src}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={`w-full rounded-2xl border border-amber-200 bg-amber-100 ${className}`}
    />
  )
}

/** Google Maps embeds show one place at a time, so pair the map with a picker list. */
export function PujaMapPicker({ pujas, home, className = 'h-96' }: { pujas: Puja[]; home: Home; className?: string }) {
  const [selId, setSelId] = useState<string | null>(null)
  const sel = pujas.find((p) => p.id === selId) ?? pujas[0]
  if (!sel) return null
  return (
    <div className="grid gap-3 md:grid-cols-[16rem_1fr]">
      <ul className={`space-y-1 overflow-y-auto rounded-2xl border border-amber-200 bg-white p-2 ${className}`}>
        {pujas.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => setSelId(p.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${p.id === sel.id ? 'bg-red-700 text-white' : 'hover:bg-amber-50'}`}
            >
              <span className="block font-medium">{p.name}</span>
              <span className={`text-xs ${p.id === sel.id ? 'text-red-100' : 'text-stone-500'}`}>
                {p.venue.city} · ~{driveMinutes(home, p.venue)} min
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        <GoogleMapFrame src={placeEmbedUrl(sel)} title={`Map of ${sel.name}`} className={className} />
        <div className="flex flex-wrap gap-3 text-sm">
          <a href={`#/puja/${sel.id}`} className="text-red-700 underline">{sel.name} details</a>
          <a href={routeLinkUrl(home, [sel], false)} target="_blank" rel="noreferrer" className="text-red-700 underline">
            Directions in Google Maps
          </a>
        </div>
      </div>
    </div>
  )
}
