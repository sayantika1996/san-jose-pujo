import { useState } from 'react'
import { PujaMapPicker } from '../components/GoogleMap'
import { PujaCard } from '../components/PujaCard'
import { allDates, fmtDate, meta, pujas, SAN_JOSE, todayIso } from '../data'
import { driveMinutes } from '../planner'
import type { Home as HomeT } from '../types'

interface Props {
  home: HomeT
  setHome: (h: HomeT) => void
  favs: string[]
  toggle: (id: string) => void
}

function daysUntil(iso: string) {
  const ms = new Date(`${iso}T00:00:00`).getTime() - new Date(`${todayIso()}T00:00:00`).getTime()
  return Math.round(ms / 86_400_000)
}

function HomeBase({ home, setHome }: Pick<Props, 'home' | 'setHome'>) {
  const [editing, setEditing] = useState(false)
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')

  const search = async () => {
    setMsg('Searching…')
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(q)}`
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[]
      if (!hit) return setMsg('No match. Try a street address or zip code.')
      setHome({ label: hit.display_name.split(',').slice(0, 3).join(','), lat: Number(hit.lat), lng: Number(hit.lon) })
      setEditing(false)
      setMsg('')
    } catch {
      setMsg('Lookup failed. Check your connection.')
    }
  }

  const locate = () =>
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setHome({ label: 'My current location', lat: p.coords.latitude, lng: p.coords.longitude })
        setEditing(false)
      },
      () => setMsg('Location permission denied.'),
    )

  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          🏠 Drive times are from <b>{home.label}</b>
        </p>
        <button className="text-red-700 underline" onClick={() => setEditing((e) => !e)}>
          {editing ? 'Cancel' : 'Change'}
        </button>
      </div>
      {editing && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Address or zip, e.g. 95134"
            className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-1.5"
          />
          <button onClick={search} className="rounded-lg bg-red-700 px-3 py-1.5 text-white">
            Set
          </button>
          <button onClick={locate} className="rounded-lg border border-stone-300 px-3 py-1.5">
            Use my location
          </button>
          <button onClick={() => { setHome(SAN_JOSE); setEditing(false) }} className="rounded-lg border border-stone-300 px-3 py-1.5">
            Reset
          </button>
          <p className="w-full text-xs text-stone-500">Saved only in this browser. Address lookup uses OpenStreetMap.</p>
        </div>
      )}
      {msg && <p className="mt-2 text-xs text-stone-600">{msg}</p>}
    </div>
  )
}

export function Home({ home, setHome, favs, toggle }: Props) {
  const today = todayIso()
  const nextDate = allDates.find((d) => d >= today)
  const bodhon = meta.tithiReference.find((t) => t.label.startsWith('Shashthi'))
  const dated = pujas.filter((p) => p.dates.length > 0)
  const nearest = [...dated].sort((a, b) => driveMinutes(home, a.venue) - driveMinutes(home, b.venue)).slice(0, 6)
  const onNext = nextDate ? dated.filter((p) => p.dates.some((d) => d.date === nextDate)) : []
  const n = nextDate ? daysUntil(nextDate) : null

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-800 via-red-700 to-amber-600 p-8 text-amber-50 shadow-lg">
        <div className="pointer-events-none absolute -top-10 -right-10 text-[11rem] leading-none opacity-15 select-none">🪔</div>
        <p className="font-bengali text-lg text-amber-200">শুভ শারদীয়া</p>
        <h1 className="font-display mt-1 text-4xl font-bold sm:text-5xl">Pujo Ghuri · San Jose</h1>
        <p className="mt-3 max-w-xl text-amber-100">
          My Durga Puja {meta.year}: the pujos I care about, ranked by distance from home, with a planner for pandal-hopping days.
        </p>
        {n !== null && (
          <p className="mt-6 inline-block rounded-full bg-white/15 px-4 py-2 font-medium backdrop-blur">
            {n === 0 ? 'Pujos are on today! 🥁' : n === 1 ? 'Pujos start tomorrow! 🥁' : `${n} days to the next pujo (${fmtDate(nextDate!)})`}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#/plan" className="rounded-full bg-amber-300 px-5 py-2 font-semibold text-red-900 hover:bg-amber-200">
            Plan a pandal-hopping day →
          </a>
          <a href="#/pujas" className="rounded-full border border-amber-200 px-5 py-2 font-semibold hover:bg-white/10">
            Browse my {pujas.length} pujos
          </a>
        </div>
      </section>

      <HomeBase home={home} setHome={setHome} />

      {nextDate && onNext.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-semibold text-red-900">On {fmtDate(nextDate, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          <p className="text-sm text-stone-600">{onNext.length} pujos open that day</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {onNext
              .sort((a, b) => driveMinutes(home, a.venue) - driveMinutes(home, b.venue))
              .slice(0, 6)
              .map((p) => (
                <PujaCard key={p.id} puja={p} home={home} fav={favs.includes(p.id)} onFav={() => toggle(p.id)} />
              ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl font-semibold text-red-900">Closest to home</h2>
        <div className="mt-4">
          <PujaMapPicker pujas={nearest} home={home} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-red-900">Tithi calendar {meta.year}</h2>
        {bodhon && <p className="text-sm text-stone-600">Bodhon falls on {fmtDate(bodhon.date)}. Many Bay Area pujos move to the nearest weekend.</p>}
        <ol className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {meta.tithiReference.map((t) => (
            <li key={t.date} className={`rounded-xl border p-3 ${t.date === today ? 'border-red-700 bg-red-50' : 'border-amber-200 bg-white'}`}>
              <p className="text-xs text-stone-500">{fmtDate(t.date)}</p>
              <p className="font-bengali text-lg text-red-800">{t.labelBn}</p>
              <p className="text-xs text-stone-700">{t.label}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
