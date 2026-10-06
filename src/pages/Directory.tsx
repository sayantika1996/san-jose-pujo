import { useMemo, useState } from 'react'
import { PujaMapPicker } from '../components/GoogleMap'
import { PujaCard } from '../components/PujaCard'
import { allDates, fmtDate, pujas, regions } from '../data'
import { driveMinutes } from '../planner'
import type { Home } from '../types'

interface Props {
  home: Home
  favs: string[]
  toggle: (id: string) => void
  onlyFavs?: boolean
}

export function Directory({ home, favs, toggle, onlyFavs = false }: Props) {
  const [date, setDate] = useState('')
  const [region, setRegion] = useState('')
  const [maxDrive, setMaxDrive] = useState(0)
  const [free, setFree] = useState(false)
  const [bhog, setBhog] = useState(false)
  const [hideTba, setHideTba] = useState(false)
  const [view, setView] = useState<'list' | 'map'>('list')

  const list = useMemo(
    () =>
      pujas
        .filter((p) => !onlyFavs || favs.includes(p.id))
        .filter((p) => !date || p.dates.some((d) => d.date === date))
        .filter((p) => !region || p.region === region)
        .filter((p) => !maxDrive || driveMinutes(home, p.venue) <= maxDrive)
        .filter((p) => !free || p.entry?.free)
        .filter((p) => !bhog || p.bhog?.available)
        .filter((p) => !hideTba || p.status !== 'tba')
        .sort((a, b) => driveMinutes(home, a.venue) - driveMinutes(home, b.venue)),
    [onlyFavs, favs, date, region, maxDrive, free, bhog, hideTba, home],
  )

  const sel = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm'
  const chk = 'flex items-center gap-1.5 text-sm'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-red-900">{onlyFavs ? 'My pujo list' : 'All pujos'}</h1>
        <p className="text-sm text-stone-600">
          {onlyFavs
            ? 'Pujos you starred. They stay in this browser and can be sent straight to the planner.'
            : 'Sorted by drive time from home.'}
        </p>
      </div>

      {onlyFavs && favs.length > 0 && (
        <a href={`#/plan?m=${favs.join(',')}`} className="inline-block rounded-full bg-red-700 px-5 py-2 font-semibold text-white hover:bg-red-800">
          Plan a day with my list →
        </a>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-white p-4">
        <select className={sel} value={date} onChange={(e) => setDate(e.target.value)}>
          <option value="">Any date</option>
          {allDates.map((d) => (
            <option key={d} value={d}>
              {fmtDate(d)}
            </option>
          ))}
        </select>
        <select className={sel} value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select className={sel} value={maxDrive} onChange={(e) => setMaxDrive(Number(e.target.value))}>
          <option value={0}>Any distance</option>
          <option value={20}>≤ 20 min drive</option>
          <option value={35}>≤ 35 min drive</option>
          <option value={50}>≤ 50 min drive</option>
          <option value={75}>≤ 75 min drive</option>
        </select>
        <label className={chk}>
          <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} /> Free entry
        </label>
        <label className={chk}>
          <input type="checkbox" checked={bhog} onChange={(e) => setBhog(e.target.checked)} /> Bhog
        </label>
        <label className={chk}>
          <input type="checkbox" checked={hideTba} onChange={(e) => setHideTba(e.target.checked)} /> Hide TBA
        </label>
        <div className="ml-auto flex overflow-hidden rounded-lg border border-stone-300 text-sm">
          {(['list', 'map'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 capitalize ${view === v ? 'bg-red-700 text-white' : 'bg-white'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-stone-600">{list.length} pujos</p>

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
          {onlyFavs && favs.length === 0 ? (
            <>
              Nothing here yet. Tap <b>☆ Add</b> on any pujo to save it.
            </>
          ) : (
            'No pujos match these filters.'
          )}
        </p>
      ) : view === 'map' ? (
        <PujaMapPicker pujas={list} home={home} className="h-[32rem]" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <PujaCard key={p.id} puja={p} home={home} fav={favs.includes(p.id)} onFav={() => toggle(p.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
