import { useState } from 'react'
import { fmtDate, fmtTime, pujas } from '../data'
import { driveMinutes } from '../planner'
import type { Home } from '../types'

interface Item {
  date: string
  time?: string
  title: string
  detail?: string
  pujaId: string
  pujaName: string
  city: string
  drive: number
  kind: 'program' | 'special'
}

const SPECIAL = /dhunuchi|sindoor|sindur|kumari|sandhi|dandiya|anandamela|ananda mela|garba|concert|live|band|bijoya|visarjan|competition|contest|magic|drama|fashion|quiz/i

export function Events({ home }: { home: Home }) {
  const [date, setDate] = useState('')
  const [maxDrive, setMaxDrive] = useState(0)

  const items: Item[] = []
  for (const p of pujas) {
    const drive = driveMinutes(home, p.venue)
    const base = { pujaId: p.id, pujaName: p.name, city: p.venue.city, drive }
    for (const c of p.culturalPrograms) {
      if (!c.date) continue
      items.push({ ...base, date: c.date, time: c.time, title: c.title, detail: [c.artist, c.description].filter(Boolean).join(' · '), kind: 'program' })
    }
    for (const s of p.schedule) {
      if (!SPECIAL.test(s.title)) continue
      if (p.culturalPrograms.some((c) => c.date === s.date && c.title.toLowerCase() === s.title.toLowerCase())) continue
      items.push({ ...base, date: s.date, time: s.start, title: s.title, kind: 'special' })
    }
  }

  const shown = items
    .filter((i) => !date || i.date === date)
    .filter((i) => !maxDrive || i.drive <= maxDrive)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '99').localeCompare(b.time ?? '99') || a.drive - b.drive)

  const dates = Array.from(new Set(items.map((i) => i.date))).sort()
  const byDate = dates
    .filter((d) => shown.some((i) => i.date === d))
    .map((d) => ({ d, list: shown.filter((i) => i.date === d) }))
  const sel = 'rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-red-900">Events & performances</h1>
        <p className="text-sm text-stone-600">Concerts, guest artists, dhunuchi naach, sindoor khela, dandiya and more across every pujo.</p>
      </div>
      <div className="flex flex-wrap gap-3 rounded-2xl border border-amber-200 bg-white p-4">
        <select className={sel} value={date} onChange={(e) => setDate(e.target.value)}>
          <option value="">All dates</option>
          {dates.map((d) => <option key={d} value={d}>{fmtDate(d)}</option>)}
        </select>
        <select className={sel} value={maxDrive} onChange={(e) => setMaxDrive(Number(e.target.value))}>
          <option value={0}>Any distance</option>
          <option value={30}>≤ 30 min drive</option>
          <option value={50}>≤ 50 min drive</option>
          <option value={75}>≤ 75 min drive</option>
        </select>
        <span className="self-center text-sm text-stone-600">{shown.length} events</span>
      </div>
      {byDate.length === 0 && <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500">No events match.</p>}
      {byDate.map(({ d, list }) => (
        <section key={d}>
          <h2 className="font-display text-xl font-semibold text-red-900">{fmtDate(d, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          <ul className="mt-2 divide-y divide-amber-100 rounded-2xl border border-amber-200 bg-white">
            {list.map((i, k) => (
              <li key={k} className="flex gap-4 p-3 text-sm">
                <span className="w-16 shrink-0 text-stone-500">{i.time ? fmtTime(i.time) : 'TBA'}</span>
                <div className="min-w-0">
                  <p className="font-medium text-stone-900">{i.kind === 'program' ? '🎤' : '🥁'} {i.title}</p>
                  {i.detail && <p className="text-stone-600">{i.detail}</p>}
                  <a href={`#/puja/${i.pujaId}`} className="text-xs text-red-700 hover:underline">
                    {i.pujaName} · {i.city} · ~{i.drive} min
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
